// === GOOGLE DRIVE MODULE - PROPER INITIALIZATION ===

// Global state - attached to window for persistence
window.GlassHorsesDrive = window.GlassHorsesDrive || {
  gapiLoaded: false,
  gapiInited: false,
  gapiLoadPromise: null,
  initializationPromise: null,
  lastInitTime: null
};

const DriveState = window.GlassHorsesDrive;

// === GOOGLE API LOADER WITH OFFICIAL PATTERN ===
function loadGAPI() {
  if (DriveState.gapiLoadPromise) {
    return DriveState.gapiLoadPromise;
  }
  
  DriveState.gapiLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.gapi && window.gapi.load) {
      console.log('✅ gapi already loaded');
      DriveState.gapiLoaded = true;
      return resolve(true);
    }
    
    console.log('📦 Loading Google API...');
    
    // Create script element with Google's official pattern
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    
    // Set timeout for script loading
    const loadTimeout = setTimeout(() => {
      reject(new Error('Google API script load timeout'));
    }, 10000);
    
    script.onload = () => {
      clearTimeout(loadTimeout);
      console.log('✅ Google API script loaded');
      DriveState.gapiLoaded = true;
      resolve(true);
    };
    
    script.onerror = (error) => {
      clearTimeout(loadTimeout);
      console.error('❌ Failed to load Google API script:', error);
      reject(new Error('Failed to load Google API script'));
    };
    
    // Append to head
    document.head.appendChild(script);
  });
  
  return DriveState.gapiLoadPromise;
}

// === INITIALIZE GOOGLE DRIVE API (OFFICIAL PATTERN) ===
function initDriveAPI() {
  if (DriveState.initializationPromise) {
    return DriveState.initializationPromise;
  }
  
  DriveState.initializationPromise = new Promise((resolve, reject) => {
    // Check if already initialized
    if (DriveState.gapiInited && window.gapi && window.gapi.client && window.gapi.client.drive) {
      console.log('✅ Google Drive API already initialized');
      return resolve(true);
    }
    
    console.log('🔧 Initializing Google Drive API...');
    
    // Load gapi first
    loadGAPI().then(() => {
      // Use Google's official gapi.load pattern
      window.gapi.load('client', {
        callback: () => {
          console.log('📁 Loading Drive API v3...');
          
          // Initialize the client with API key and Discovery Doc
          window.gapi.client.init({
            apiKey: '', // Not needed for OAuth
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          }).then(() => {
            console.log('✅ Google Drive API initialized successfully');
            DriveState.gapiInited = true;
            DriveState.lastInitTime = Date.now();
            localStorage.setItem('drive_last_init', DriveState.lastInitTime.toString());
            resolve(true);
          }).catch(initError => {
            console.error('❌ Failed to initialize gapi client:', initError);
            DriveState.initializationPromise = null;
            reject(new Error('Failed to initialize Google Drive client: ' + initError.message));
          });
        },
        onerror: (error) => {
          console.error('❌ Failed to load gapi client:', error);
          DriveState.initializationPromise = null;
          reject(new Error('Failed to load Google API client'));
        },
        timeout: 15000, // 15 second timeout
        ontimeout: () => {
          console.error('❌ Google API load timeout');
          DriveState.initializationPromise = null;
          reject(new Error('Google API load timeout'));
        }
      });
    }).catch(loadError => {
      console.error('❌ Failed to load gapi:', loadError);
      DriveState.initializationPromise = null;
      reject(loadError);
    });
  });
  
  return DriveState.initializationPromise;
}

// === ENSURE DRIVE INITIALIZED (WITH CACHING) ===
async function ensureDriveInitialized() {
  // Check cache (5 minutes)
  const lastInit = localStorage.getItem('drive_last_init');
  if (lastInit && (Date.now() - parseInt(lastInit)) < 5 * 60 * 1000) {
    if (DriveState.gapiInited) {
      console.log('♻️ Using cached Drive initialization');
      return true;
    }
  }
  
  return initDriveAPI();
}

// === PRELOAD IN BACKGROUND ===
async function preloadGoogleDrive() {
  try {
    // Only preload if user is logged in
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) {
      return false;
    }
    
    console.log('🔄 Pre-loading Google Drive API...');
    
    // Start initialization in background
    ensureDriveInitialized().then(() => {
      console.log('✅ Google Drive pre-loaded successfully');
    }).catch(error => {
      console.warn('⚠️ Background preload failed:', error.message);
    });
    
    return true;
  } catch (error) {
    console.warn('⚠️ Preload check failed:', error.message);
    return false;
  }
}

// === CREATE PLAYER SAVE FOLDER ===
async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) {
    console.error('Drive status element not found');
    return;
  }
  
  try {
    // Clear previous status
    statusEl.innerHTML = '';
    
    // Step 1: Check authentication
    statusEl.innerHTML = `
      <div class="drive-status">
        🔐 Checking authentication...
      </div>
    `;
    
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) {
      throw new Error('Please login with Google first!');
    }
    
    // Step 2: Initialize Drive API
    statusEl.innerHTML = `
      <div class="drive-status">
        🔄 Initializing Google Drive API...
        <br><small>This may take a few seconds</small>
      </div>
    `;
    
    await ensureDriveInitialized();
    
    // Step 3: Set OAuth token
    statusEl.innerHTML = `
      <div class="drive-status">
        🔑 Setting up Google Drive access...
      </div>
    `;
    
    // Set the access token for Drive API
    window.gapi.auth.setToken({
      access_token: session.provider_token,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      token_type: 'Bearer'
    });
    
    // Step 4: Create folder in appDataFolder
    statusEl.innerHTML = `
      <div class="drive-status">
        📁 Creating game save folder...
      </div>
    `;
    
    const folderMetadata = {
      name: 'GlassHorses',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['appDataFolder'] // Hidden app-specific folder
    };
    
    // Create the folder
    const folderResponse = await window.gapi.client.drive.files.create({
      resource: folderMetadata,
      fields: 'id,name'
    });
    
    const folderId = folderResponse.result.id;
    
    // Step 5: Create test file
    statusEl.innerHTML = `
      <div class="drive-status">
        📄 Creating test save file...
      </div>
    `;
    
    const timestamp = new Date().toISOString();
    const testContent = `# GlassHorses Save File\n\n**Created:** ${timestamp}\n**Player:** ${session.user.user_metadata.full_name || session.user.email}\n**Folder ID:** ${folderId}\n\nWelcome to GlassHorses!`;
    
    const fileMetadata = {
      name: 'test_save.md',
      parents: [folderId],
      mimeType: 'text/plain'
    };
    
    // Create text blob for file content
    const textBlob = new Blob([testContent], { type: 'text/plain' });
    
    const fileResponse = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: testContent
      },
      fields: 'id,name'
    });
    
    // Success!
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 Google Drive setup complete!
        <br><br>
        <strong>✅ Save folder created</strong>
        <br>Folder: ${folderResponse.result.name}
        <br>Folder ID: ${folderId}
        <br><br>
        <strong>✅ Test file created</strong>
        <br>File: ${fileResponse.result.name}
        <br>File ID: ${fileResponse.result.id}
        <br><br>
        <small>Your saves are stored in Google Drive's app-specific storage (not visible in My Drive).</small>
      </div>
    `;
    
    // Store folder ID for future use
    localStorage.setItem('drive_folder_id', folderId);
    console.log('✅ Drive setup complete. Folder:', folderId, 'File:', fileResponse.result.id);
    
  } catch (error) {
    console.error('❌ Drive error:', error);
    
    let errorMessage = error.message || 'Unknown error occurred';
    let userMessage = `❌ Google Drive Error: ${errorMessage}`;
    
    // Provide more helpful messages for common errors
    if (errorMessage.includes('token')) {
      userMessage += '<br><small>Your login session may have expired. Try logging out and back in.</small>';
    } else if (errorMessage.includes('timeout')) {
      userMessage += '<br><small>The request timed out. Please check your internet connection and try again.</small>';
    } else if (errorMessage.includes('load')) {
      userMessage += '<br><small>Failed to load Google Drive API. Please refresh the page and try again.</small>';
    } else if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
      userMessage += '<br><small>Make sure you granted Drive permissions when you logged in.</small>';
    }
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ${userMessage}
        <br><br>
        <button onclick="window.location.reload()" style="margin-top: 10px;">
          🔄 Refresh Page
        </button>
      </div>
    `;
    
    // Clear initialization promise on certain errors
    if (errorMessage.includes('token') || errorMessage.includes('auth') || errorMessage.includes('timeout')) {
      DriveState.initializationPromise = null;
    }
  }
}

// === CHECK EXISTING FOLDER ===
async function checkExistingDriveFolder() {
  try {
    const folderId = localStorage.getItem('drive_folder_id');
    if (!folderId) return null;
    
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) return null;
    
    await ensureDriveInitialized();
    
    // Set token
    window.gapi.auth.setToken({
      access_token: session.provider_token
    });
    
    // Try to get folder info
    const response = await window.gapi.client.drive.files.get({
      fileId: folderId,
      fields: 'id,name'
    });
    
    return response.result;
  } catch (error) {
    console.warn('⚠️ Existing folder check failed:', error.message);
    localStorage.removeItem('drive_folder_id');
    return null;
  }
}

// === GET DRIVE STATUS ===
function getDriveStatus() {
  return {
    gapiLoaded: DriveState.gapiLoaded,
    gapiInited: DriveState.gapiInited,
    hasInitPromise: !!DriveState.initializationPromise,
    lastInitTime: DriveState.lastInitTime,
    createPlayerSaveFolder: typeof createPlayerSaveFolder
  };
}

// === EXPORT FUNCTIONS IMMEDIATELY ===
(function() {
  // Main function
  window.createPlayerSaveFolder = createPlayerSaveFolder;
  
  // Helper functions
  window.preloadGoogleDrive = preloadGoogleDrive;
  window.checkExistingDriveFolder = checkExistingDriveFolder;
  window.ensureDriveInitialized = ensureDriveInitialized;
  window.getDriveStatus = getDriveStatus;
  
  // Initialize immediately
  console.log('✅ Drive module loaded');
  console.log('📊 Initial drive status:', getDriveStatus());
})();