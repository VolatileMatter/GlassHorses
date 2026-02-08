// === DIAGNOSTIC VERSION - TEST TOKEN PERMISSIONS ===

window.createPlayerSaveFolder = async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  statusEl.innerHTML = `
    <div class="drive-status">
      🔍 Running Drive diagnostic test...
    </div>
  `;
  
  try {
    // Step 1: Get session
    const { data: { session } } = await sb.auth.getSession();
    
    if (!session) {
      throw new Error('No session found. Please login.');
    }
    
    if (!session.provider_token) {
      throw new Error('No Google OAuth token found in session.');
    }
    
    // Step 2: Show token info (sanitized)
    const tokenPreview = session.provider_token.substring(0, 30) + '...';
    const userEmail = session.user.email;
    const scopes = session.provider_refresh_token ? 'Has refresh token' : 'No refresh token';
    
    statusEl.innerHTML += `
      <div class="drive-status">
        🔐 Session Info:
        <br>User: ${userEmail}
        <br>Token: ${tokenPreview}
        <br>${scopes}
        <br><br>🔄 Testing token permissions...
      </div>
    `;
    
    console.log('📊 Session data:', {
      hasProviderToken: !!session.provider_token,
      tokenLength: session.provider_token.length,
      hasRefreshToken: !!session.provider_refresh_token,
      user: session.user.email
    });
    
    // Step 3: Try to decode token (JWT) to see scopes
    try {
      // Simple JWT decode (just for viewing payload)
      const tokenParts = session.provider_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('🔍 Token payload:', payload);
        
        if (payload.scope) {
          statusEl.innerHTML += `
            <br>📋 Token scopes: ${payload.scope}
          `;
        }
      }
    } catch (e) {
      console.log('⚠️ Could not decode token:', e.message);
    }
    
    // Step 4: Test with a SIMPLE Google API call
    statusEl.innerHTML += `
      <br><br>🌐 Testing Google API connection...
    `;
    
    // Load Google API directly
    await new Promise((resolve, reject) => {
      if (window.gapi) return resolve();
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
    
    // Initialize minimally
    await new Promise((resolve, reject) => {
      gapi.load('client', () => {
        gapi.client.init({}).then(resolve).catch(reject);
      });
    });
    
    statusEl.innerHTML += `
      <br>✅ Google API loaded
      <br><br>🔑 Setting token and testing...
    `;
    
    // Set the token
    gapi.auth.setToken({
      access_token: session.provider_token,
      token_type: 'Bearer'
    });
    
    // Step 5: Try the SIMPLEST possible Drive API call
    // List files in appDataFolder (empty response expected)
    statusEl.innerHTML += `
      <br>📂 Testing appDataFolder access...
    `;
    
    const response = await gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      pageSize: 1,
      fields: 'files(id,name)'
    });
    
    // If we get here, it WORKED!
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 SUCCESS! Drive permissions are CORRECT!
        <br><br>
        ✅ Google API connected
        <br>✅ OAuth token accepted
        <br>✅ Drive.appdata scope granted
        <br>✅ Can access appDataFolder
        <br><br>
        Found ${response.result.files.length} file(s) in appDataFolder
        <br><br>
        <small>Now try creating a file...</small>
      </div>
    `;
    
    console.log('✅ Drive list successful:', response.result);
    
    // Step 6: NOW try creating a file
    setTimeout(async () => {
      try {
        statusEl.innerHTML += `
          <br>📝 Attempting to create test file...
        `;
        
        const fileMetadata = {
          name: `test_${Date.now()}.txt`,
          parents: ['appDataFolder'],
          mimeType: 'text/plain'
        };
        
        const createResponse = await gapi.client.drive.files.create({
          resource: fileMetadata,
          media: {
            mimeType: 'text/plain',
            body: 'Test content from GlassHorses'
          },
          fields: 'id,name'
        });
        
        statusEl.innerHTML = `
          <div class="drive-success">
            🎉 COMPLETE SUCCESS!
            <br><br>
            ✅ File created: ${createResponse.result.name}
            <br>✅ File ID: ${createResponse.result.id}
            <br><br>
            <strong>Google Drive integration is WORKING!</strong>
          </div>
        `;
        
      } catch (createError) {
        console.error('Create error:', createError);
        statusEl.innerHTML += `
          <div class="drive-error">
            ❌ File creation failed
            <br>Error: ${createError.message}
            <br><br>
            But listing worked! This suggests a different issue.
          </div>
        `;
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    
    let errorDetails = error.message;
    let suggestions = '';
    
    if (error.message.includes('403') || error.message.includes('permission')) {
      suggestions = `
        <br><br><strong>Likely Issue:</strong> OAuth token missing Drive scope
        <br><br><strong>To Fix:</strong>
        <br>1. Logout completely
        <br>2. Clear browser cache/cookies
        <br>3. Login again
        <br>4. When Google asks for permissions, ensure Drive access is granted
        <br><br>
        <button onclick="window.signOut && signOut(); setTimeout(() => window.location.reload(), 1000)">
          🔄 Logout & Retry
        </button>
      `;
    } else if (error.message.includes('token')) {
      suggestions = `
        <br><br><strong>Issue:</strong> Invalid or expired token
        <br>Try logging out and back in.
      `;
    }
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ Drive Diagnostic Failed
        <br><br>
        <strong>Error:</strong> ${errorDetails}
        ${suggestions}
        <br><br>
        <small>Check console (F12) for detailed error.</small>
      </div>
    `;
  }
};

console.log('✅ Diagnostic version loaded');