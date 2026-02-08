// === GOOGLE DRIVE MODULE - SIMPLIFIED FOR TESTING ===

// Global state
window.GlassHorsesDrive = window.GlassHorsesDrive || {
  gapiLoaded: false,
  gapiInited: false,
  initializationPromise: null
};

const DriveState = window.GlassHorsesDrive;

// === LOAD GOOGLE API ===
function loadGAPI() {
  return new Promise((resolve, reject) => {
    if (window.gapi && window.gapi.load) {
      console.log('✅ gapi already loaded');
      DriveState.gapiLoaded = true;
      return resolve(true);
    }
    
    console.log('📦 Loading Google API...');
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    
    const timeout = setTimeout(() => {
      reject(new Error('Google API load timeout'));
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeout);
      console.log('✅ Google API script loaded');
      DriveState.gapiLoaded = true;
      resolve(true);
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load Google API'));
    };
    
    document.head.appendChild(script);
  });
}

// === INITIALIZE DRIVE API ===
function initDriveAPI() {
  if (DriveState.initializationPromise) {
    return DriveState.initializationPromise;
  }
  
  DriveState.initializationPromise = new Promise((resolve, reject) => {
    if (DriveState.gapiInited) {
      return resolve(true);
    }
    
    console.log('🔧 Initializing Google Drive API...');
    
    loadGAPI().then(() => {
      window.gapi.load('client', {
        callback: () => {
          console.log('📁 Loading Drive API v3...');
          
          window.gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          }).then(() => {
            console.log('✅ Google Drive API initialized');
            DriveState.gapiInited = true;
            resolve(true);
          }).catch(initError => {
            reject(new Error('Failed to init client: ' + initError.message));
          });
        },
        onerror: () => reject(new Error('Failed to load client')),
        timeout: 10000,
        ontimeout: () => reject(new Error('Client load timeout'))
      });
    }).catch(error => reject(error));
  });
  
  return DriveState.initializationPromise;
}

// === SIMPLE TEST: CREATE FILE IN APPDATAFOLDER ===
async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  try {
    // Clear and show loading
    statusEl.innerHTML = `
      <div class="drive-status">
        🚀 Starting Google Drive test...
      </div>
    `;
    
    // 1. Check authentication
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) {
      throw new Error('Please login with Google first!');
    }
    
    statusEl.innerHTML = `
      <div class="drive-status">
        🔄 Initializing Drive API...
      </div>
    `;
    
    // 2. Initialize Drive API
    await initDriveAPI();
    
    statusEl.innerHTML = `
      <div class="drive-status">
        🔑 Setting authentication...
      </div>
    `;
    
    // 3. Set the access token
    window.gapi.auth.setToken({
      access_token: session.provider_token,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      token_type: 'Bearer'
    });
    
    statusEl.innerHTML = `
      <div class="drive-status">
        📄 Creating test file...
      </div>
    `;
    
    // 4. CREATE FILE DIRECTLY IN APPDATAFOLDER
    const timestamp = new Date().toISOString();
    const testContent = `# GlassHorses Test File\n\nCreated: ${timestamp}\nUser: ${session.user.email}\n\nThis is a test to verify Google Drive integration works.`;
    
    const fileMetadata = {
      name: 'glasshorses_test.md',
      parents: ['appDataFolder'], // DIRECT parent is appDataFolder
      mimeType: 'text/plain'
    };
    
    console.log('Creating file with metadata:', fileMetadata);
    
    const response = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: testContent
      },
      fields: 'id,name,size,createdTime'
    });
    
    // SUCCESS!
    const file = response.result;
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 SUCCESS! Google Drive works!
        <br><br>
        <strong>✅ Test file created:</strong>
        <br>File: ${file.name}
        <br>ID: ${file.id}
        <br>Created: ${new Date(file.createdTime).toLocaleString()}
        <br>Size: ${file.size || '0'} bytes
        <br><br>
        <small>File saved to Google Drive app-specific storage.</small>
        <br><small>Check Google Drive → Settings → Manage Apps to see it.</small>
      </div>
    `;
    
    console.log('✅ File created successfully:', file);
    
    // Store file ID for reference
    localStorage.setItem('drive_test_file_id', file.id);
    
  } catch (error) {
    console.error('❌ Drive error:', error);
    
    let errorMessage = error.message || 'Unknown error';
    let details = '';
    
    // Parse the error response if available
    if (error.result && error.result.error) {
      errorMessage = error.result.error.message || errorMessage;
      if (error.result.error.errors) {
        details = error.result.error.errors.map(e => e.message).join(', ');
      }
    }
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ Google Drive Error
        <br><br>
        <strong>${errorMessage}</strong>
        ${details ? `<br><small>${details}</small>` : ''}
        <br><br>
        <small>Check the console (F12) for full error details.</small>
        <br><br>
        <button onclick="window.location.reload()" style="margin-top: 10px;">
          🔄 Refresh Page
        </button>
      </div>
    `;
  }
}

// === SIMPLE PRELOAD ===
async function preloadGoogleDrive() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) return false;
    
    console.log('🔄 Pre-loading Drive API...');
    
    initDriveAPI().then(() => {
      console.log('✅ Drive pre-loaded');
    }).catch(error => {
      console.warn('⚠️ Preload failed:', error.message);
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

// === EXPORT FUNCTIONS ===
(function() {
  window.createPlayerSaveFolder = createPlayerSaveFolder;
  window.preloadGoogleDrive = preloadGoogleDrive;
  window.initDriveAPI = initDriveAPI;
  
  console.log('✅ Drive module loaded');
  console.log('✅ createPlayerSaveFolder available:', typeof window.createPlayerSaveFolder);
})();