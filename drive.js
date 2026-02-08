// === MINIMAL WORKING GOOGLE DRIVE TEST - HYBRID AUTH ===

window.createPlayerSaveFolder = async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  statusEl.innerHTML = '<div class="drive-status">🚀 Testing Google Drive...</div>';
  
  try {
    // 1. Check Supabase session (UI state)
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) throw new Error('Please login first');
    
    statusEl.innerHTML += `<br>✅ User: ${session.user.email}`;
    
    // 2. Get Drive token from hybrid auth
    if (!window.GlassHorsesDrive?.driveToken) {
      throw new Error('Drive auth not initialized. Refresh page.');
    }
    
    statusEl.innerHTML += `<br>✅ Drive token ready`;
    
    // 3. Load Google API client
    if (!window.gapi?.client) {
      statusEl.innerHTML += `<br>📦 Loading Google API...`;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.onload = () => {
          gapi.load('client', resolve);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // 4. Init client with Drive token
    statusEl.innerHTML += `<br>🔧 Initializing client...`;
    gapi.auth.setToken({ 
      access_token: window.GlassHorsesDrive.driveToken,
      token_type: 'Bearer'
    });
    
    await gapi.client.init({
      apiKey: 'AIzaSy...', // Optional public API key
      discoveryDocs: ['https://www.googleapis.com/discovery/v3/apis/drive/v3/rest']
    });
    
    // 5. Load Drive API
    statusEl.innerHTML += `<br>📁 Loading Drive API...`;
    await new Promise((resolve) => gapi.client.load('drive', 'v3', resolve));
    
    statusEl.innerHTML += `<br>✅ Drive API ready`;
    
    // 6. CREATE TEST FILE IN ROOT (works with drive.file)
    statusEl.innerHTML += `<br>📝 Creating test file...`;
    
    const fileMetadata = {
      name: `glasshorses_test_${Date.now()}.txt`,
      // ✅ FIXED: Root folder - works with drive.file scope
      parents: []  
    };
    
    const mediaData = `Test from GlassHorses\nTime: ${new Date().toISOString()}\nUser: ${session.user.email}`;
    
    const response = await gapi.client.drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: mediaData
      },
      fields: 'id,name,createdTime'
    });
    
    // SUCCESS!
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 GOOGLE DRIVE WORKS!
        <br><br>
        ✅ File: ${response.result.name}
        <br>✅ ID: ${response.result.id}
        <br>✅ Created: ${new Date(response.result.createdTime).toLocaleString()}
        <br><br>
        <strong>Drive integration ready!</strong>
      </div>
    `;
    
  } catch (error) {
    console.error('❌ Drive Error:', error);
    const message = error.result?.error?.message || error.message;
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ ${message}
        <br><br>
        <button onclick="location.reload()">🔄 Refresh</button>
        <button onclick="signOut();setTimeout(()=>location.reload(),1000)">🔄 Logout & Retry</button>
      </div>
    `;
  }
};

console.log('✅ Hybrid drive.js loaded');
