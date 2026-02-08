// === DIAGNOSTIC VERSION - FIXED DRIVE API LOADING ===

window.createPlayerSaveFolder = async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  statusEl.innerHTML = `
    <div class="drive-status">
      🔍 Running Drive diagnostic...
    </div>
  `;
  
  try {
    // Step 1: Get session
    const { data: { session } } = await sb.auth.getSession();
    
    if (!session) throw new Error('No session. Please login.');
    if (!session.provider_token) throw new Error('No Google OAuth token.');
    
    statusEl.innerHTML += `
      <br>✅ User: ${session.user.email}
      <br>✅ Token present
      <br><br>📦 Loading Google API...
    `;
    
    // Step 2: Load Google API
    await new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.load) {
        console.log('gapi already loaded');
        return resolve();
      }
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google API'));
      script.async = true;
      document.head.appendChild(script);
    });
    
    statusEl.innerHTML += `<br>✅ Google API loaded`;
    
    // Step 3: LOAD THE DRIVE API SPECIFICALLY
    statusEl.innerHTML += `<br>📁 Loading Drive API module...`;
    
    await new Promise((resolve, reject) => {
      gapi.load('client:drive', {
        callback: resolve,
        onerror: reject,
        timeout: 10000
      });
    });
    
    statusEl.innerHTML += `<br>✅ Drive API module loaded`;
    
    // Step 4: Initialize the client
    statusEl.innerHTML += `<br>🔧 Initializing client...`;
    
    await gapi.client.init({
      // No API key needed for OAuth
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    });
    
    statusEl.innerHTML += `<br>✅ Client initialized`;
    
    // Step 5: Verify Drive API is available
    if (!gapi.client.drive) {
      throw new Error('Drive API not loaded into gapi.client');
    }
    
    statusEl.innerHTML += `<br>✅ gapi.client.drive is available`;
    
    // Step 6: Set the OAuth token
    statusEl.innerHTML += `<br>🔑 Setting OAuth token...`;
    
    gapi.auth.setToken({
      access_token: session.provider_token,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      token_type: 'Bearer'
    });
    
    statusEl.innerHTML += `<br>✅ Token set`;
    
    // Step 7: TEST: List files in appDataFolder
    statusEl.innerHTML += `<br><br>📂 Testing appDataFolder access...`;
    
    const listResponse = await gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      pageSize: 5,
      fields: 'files(id, name, mimeType, size)',
      q: "trashed = false"
    });
    
    const fileCount = listResponse.result.files ? listResponse.result.files.length : 0;
    
    statusEl.innerHTML += `
      <br>✅ Can list files in appDataFolder
      <br>📊 Found ${fileCount} file(s)
    `;
    
    if (fileCount > 0) {
      statusEl.innerHTML += `<br>Files: ${listResponse.result.files.map(f => f.name).join(', ')}`;
    }
    
    // Step 8: CREATE a test file
    statusEl.innerHTML += `<br><br>📝 Creating test file...`;
    
    const fileName = `glasshorses_test_${Date.now()}.txt`;
    const fileContent = `Test file created by GlassHorses\nTime: ${new Date().toISOString()}\nUser: ${session.user.email}`;
    
    const createResponse = await gapi.client.drive.files.create({
      resource: {
        name: fileName,
        parents: ['appDataFolder'],
        mimeType: 'text/plain'
      },
      media: {
        mimeType: 'text/plain',
        body: fileContent
      },
      fields: 'id, name, mimeType, createdTime'
    });
    
    // SUCCESS!
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 COMPLETE SUCCESS!
        <br><br>
        <strong>✅ Google Drive Integration WORKS!</strong>
        <br><br>
        📄 File Created: ${createResponse.result.name}
        <br>🔑 File ID: ${createResponse.result.id}
        <br>📅 Created: ${new Date(createResponse.result.createdTime).toLocaleString()}
        <br><br>
        <small>File saved to Google Drive app-specific storage.</small>
        <br><small>Check Google Drive → Settings → Manage Apps to view.</small>
      </div>
    `;
    
    console.log('✅ File created successfully:', createResponse.result);
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    
    let errorMessage = error.message;
    let errorDetails = '';
    let suggestions = '';
    
    // Parse Google API errors
    if (error.result && error.result.error) {
      errorMessage = error.result.error.message || errorMessage;
      if (error.result.error.errors) {
        errorDetails = error.result.error.errors.map(e => 
          `${e.domain}: ${e.message} (${e.reason})`
        ).join('<br>');
      }
    }
    
    // Provide specific suggestions
    if (errorMessage.includes('insufficientFilePermissions') || errorMessage.includes('403')) {
      suggestions = `
        <br><br><strong>PERMISSION ISSUE:</strong>
        <br>OAuth token doesn't have Drive permissions.
        <br><br><strong>To Fix:</strong>
        <br>1. Logout completely
        <br>2. Clear browser cache/cookies
        <br>3. Login again
        <br>4. When Google asks, GRANT Drive permissions
        <br><br>
        <button onclick="signOut(); setTimeout(() => location.reload(), 1000)" 
                style="padding: 8px 16px; margin-top: 10px;">
          🔄 Logout & Retry
        </button>
      `;
    } else if (errorMessage.includes('drive is undefined')) {
      suggestions = `
        <br><br><strong>API LOADING ISSUE:</strong>
        <br>Drive API module failed to load.
        <br>Check console for Google API errors.
      `;
    }
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ Diagnostic Failed
        <br><br>
        <strong>${errorMessage}</strong>
        ${errorDetails ? `<br><small>${errorDetails}</small>` : ''}
        ${suggestions}
        <br><br>
        <small>Full error in console (F12)</small>
      </div>
    `;
  }
};

console.log('✅ Diagnostic drive.js loaded');