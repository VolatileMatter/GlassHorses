// === GOOGLE DRIVE - PURE GOOGLE AUTH ===

window.createPlayerSaveFolder = async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  statusEl.innerHTML = '<div class="drive-status">🚀 Testing Google Drive...</div>';
  
  try {
    // 1. Check Google auth
    if (!window.GlassHorsesDrive?.driveToken) {
      throw new Error('Please sign in with Google first');
    }
    
    statusEl.innerHTML += `<br>✅ Drive token ready`;
    
    // 2. Load API client
    if (!window.gapi?.client) {
      statusEl.innerHTML += `<br>📦 Loading API...`;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.onload = () => gapi.load('client', resolve);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // 3. Set token and init
    statusEl.innerHTML += `<br>🔧 Setting up client...`;
    gapi.auth.setToken({ 
      access_token: window.GlassHorsesDrive.driveToken,
      token_type: 'Bearer'
    });
    
    await gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v3/apis/drive/v3/rest']
    });
    
    // 4. Load Drive API
    statusEl.innerHTML += `<br>📁 Loading Drive API...`;
    await new Promise(resolve => gapi.client.load('drive', 'v3', resolve));
    
    statusEl.innerHTML += `<br>✅ Drive ready`;
    
    // 5. CREATE FILE IN ROOT
    statusEl.innerHTML += `<br>📝 Creating test file...`;
    
    const response = await gapi.client.drive.files.create({
      resource: {
        name: `glasshorses_test_${Date.now()}.txt`,
        parents: []  // My Drive root ✅
      },
      media: {
        mimeType: 'text/plain',
        body: `GlassHorses Drive Test\n${new Date().toISOString()}`
      },
      fields: 'id,name,createdTime'
    });
    
    // SUCCESS
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 DRIVE WORKS PERFECTLY!
        <br><br>
        ✅ File: ${response.result.name}<br>
        ✅ ID: ${response.result.id}<br>
        ✅ Time: ${new Date(response.result.createdTime).toLocaleString()}
        <br><br><strong>✅ Ready for player saves!</strong>
      </div>
    `;
    
  } catch (error) {
    console.error('Drive error:', error);
    const msg = error.result?.error?.message || error.message || 'Unknown error';
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ ${msg}
        <br><br>
        <button onclick="location.reload()">🔄 Refresh</button>
        <button onclick="signOut()">🔐 Re-login</button>
      </div>
    `;
  }
};

console.log('✅ Pure Google Drive loaded');