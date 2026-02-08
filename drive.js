// === MINIMAL WORKING GOOGLE DRIVE TEST ===

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
    
    // 3. Load client WITHOUT problematic timeout parameters
    statusEl.innerHTML += `<br>🔧 Loading Drive API...`;
    
    await new Promise((resolve, reject) => {
      // SIMPLE gapi.load - NO timeout parameters
      gapi.load('client', () => {
        resolve();
      });
    });
    
    // 4. Initialize client
    await gapi.client.init({
      apiKey: '',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    });
    
    // 5. Manually load Drive API if not loaded
    if (!gapi.client.drive) {
      await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    }
    
    statusEl.innerHTML += `<br>✅ Drive API ready`;
    
    // 6. Set OAuth token
    gapi.auth.setToken({
      access_token: session.provider_token,
      token_type: 'Bearer'
    });
    
    // 7. CREATE A TEST FILE (simple approach)
    statusEl.innerHTML += `<br>📝 Creating test file...`;
    
    const response = await gapi.client.drive.files.create({
      resource: {
        name: `glasshorses_${Date.now()}.txt`,
        parents: ['appDataFolder']
      },
      media: {
        mimeType: 'text/plain',
        body: `Test from GlassHorses\n${new Date().toISOString()}\n${session.user.email}`
      },
      fields: 'id,name'
    });
    
    // SUCCESS!
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 GOOGLE DRIVE WORKS!
        <br><br>
        ✅ File created: ${response.result.name}
        <br>✅ File ID: ${response.result.id}
        <br><br>
        <strong>Drive integration is working!</strong>
      </div>
    `;
    
    console.log('✅ Success:', response.result);
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    let message = error.message;
    if (error.result?.error?.message) {
      message = error.result.error.message;
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

console.log('✅ Minimal drive.js loaded');