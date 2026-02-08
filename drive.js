// === MINIMAL WORKING GOOGLE DRIVE TEST - WITH DRIVE API LOAD ===

window.createPlayerSaveFolder = async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  statusEl.innerHTML = `
    <div class="drive-status">
      🚀 Testing Google Drive...
    </div>
  `;
  
  try {
    // 1. Get session
    const { data: { session } } = await sb.auth.getSession();
    
    if (!session?.provider_token) {
      throw new Error('Please login with Google first');
    }
    
    statusEl.innerHTML += `<br>✅ User: ${session.user.email}`;
    
    // 2. Load Google API with SIMPLE method
    statusEl.innerHTML += `<br>📦 Loading Google API...`;
    
    if (!window.gapi) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ Google API loaded');
          resolve();
        };
        
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // 3. Load client
    statusEl.innerHTML += `<br>🔧 Loading Google Client...`;
    
    await new Promise((resolve, reject) => {
      gapi.load('client', () => {
        resolve();
      });
    });
    
    // 4. **CRITICAL: LOAD DRIVE API MODULE**
    statusEl.innerHTML += `<br>📁 Loading Drive API module...`;
    
    await gapi.client.load('drive', 'v3');
    
    statusEl.innerHTML += `<br>✅ Drive API module loaded`;
    
    // 5. Initialize client (minimal)
    await gapi.client.init({});
    
    statusEl.innerHTML += `<br>✅ Client initialized`;
    
    // 6. Set OAuth token
    gapi.auth.setToken({
      access_token: session.provider_token,
      token_type: 'Bearer'
    });
    
    statusEl.innerHTML += `<br>✅ Token set`;
    
    // 7. CREATE A TEST FILE
    statusEl.innerHTML += `<br>📝 Creating test file...`;
    
    const response = await gapi.client.drive.files.create({
      resource: {
        name: `glasshorses_test_${Date.now()}.txt`,
        parents: ['appDataFolder']
      },
      media: {
        mimeType: 'text/plain',
        body: `Test from GlassHorses\nTime: ${new Date().toISOString()}\nUser: ${session.user.email}`
      },
      fields: 'id,name,createdTime'
    });
    
    // SUCCESS!
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 GOOGLE DRIVE WORKS!
        <br><br>
        ✅ File created: ${response.result.name}
        <br>✅ File ID: ${response.result.id}
        <br>✅ Created: ${new Date(response.result.createdTime).toLocaleString()}
        <br><br>
        <strong>Drive integration is working!</strong>
        <br><small>File saved to Google Drive app-specific storage.</small>
      </div>
    `;
    
    console.log('✅ Success:', response.result);
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    let message = error.message;
    if (error.result?.error?.message) {
      message = error.result.error.message;
    }
    
    // Check if it's the Drive API loading error
    if (message.includes('drive') && message.includes('not found')) {
      message = 'Drive API module failed to load. ' + message;
    }
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ ${message}
        <br><br>
        <button onclick="location.reload()">🔄 Refresh</button>
        <button onclick="signOut(); setTimeout(() => location.reload(), 1000)" 
                style="margin-left: 10px;">
          🔄 Logout & Retry
        </button>
      </div>
    `;
  }
};

console.log('✅ Fixed drive.js loaded (with Drive API load)');