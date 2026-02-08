// === GOOGLE DRIVE MODULE ===
// Note: gapiInited is declared here, not in config.js

// === INITIALIZE IMMEDIATELY ===
// This ensures the function is available as soon as possible
(function() {
  // Global flags - ONLY DECLARED HERE
  window.gapiInited = false;
  window.driveInitializationPromise = null;
  
  console.log('📦 Drive module loading...');
})();

// === LOAD GOOGLE SCRIPT ===
async function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      console.log('✅ Google API already loaded');
      return resolve(true);
    }
    
    console.log('📦 Loading Google API script...');
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google API script loaded');
      resolve(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Google API script');
      reject(new Error('Failed to load Google API script'));
    };
    document.head.appendChild(script);
  });
}

// === OPTIMIZED GOOGLE DRIVE INIT ===
async function initGoogleDrive() {
  if (window.gapiInited) {
    console.log('✅ Google Drive already initialized');
    return true;
  }
  
  console.log('🔧 Initializing Google Drive API...');
  
  // Step 1: Load client library
  await new Promise((resolve, reject) => {
    window.gapi.load('client', {
      callback: async () => {
        try {
          console.log('📁 Loading Drive API v3...');
          // Load Drive API v3 discovery document
          await window.gapi.client.load('drive', 'v3');
          window.gapiInited = true;
          console.log('✅ Google Drive API initialized');
          resolve(true);
        } catch (error) {
          console.error('❌ Failed to load Drive API:', error);
          reject(new Error('Failed to load Drive API: ' + error.message));
        }
      },
      onerror: () => {
        console.error('❌ Failed to load Google client');
        reject(new Error('Failed to load Google client'));
      },
      timeout: 10000 // 10 second timeout
    });
  });
  
  return true;
}

// === CACHED INITIALIZATION ===
async function ensureDriveInitialized() {
  // Return cached promise if available
  if (window.driveInitializationPromise) {
    console.log('♻️ Using cached Drive initialization');
    return window.driveInitializationPromise;
  }
  
  console.log('🚀 Starting Drive initialization');
  window.driveInitializationPromise = (async () => {
    try {
      if (!window.gapi) await loadGoogleScript();
      if (!window.gapiInited) await initGoogleDrive();
      
      // Store successful initialization in localStorage
      localStorage.setItem('drive_last_init', Date.now().toString());
      console.log('✅ Drive initialization complete and cached');
      return true;
    } catch (error) {
      // Clear failed promise
      window.driveInitializationPromise = null;
      throw error;
    }
  })();
  
  return window.driveInitializationPromise;
}

// === PRELOAD IN BACKGROUND ===
async function preloadGoogleDrive() {
  try {
    // Don't preload if user isn't logged in
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) {
      console.log('⚠️ Skipping Drive preload: No active session');
      return false;
    }
    
    // Check if we recently initialized (within last 5 minutes)
    const lastInit = localStorage.getItem('drive_last_init');
    if (lastInit && (Date.now() - parseInt(lastInit)) < 5 * 60 * 1000) {
      console.log('✅ Drive recently initialized, skipping preload');
      return true;
    }
    
    console.log('🔄 Pre-loading Google Drive API in background...');
    
    // Start initialization but don't block UI
    ensureDriveInitialized().then(() => {
      console.log('✅ Google Drive pre-loaded successfully');
    }).catch(error => {
      console.warn('⚠️ Background preload failed (non-critical):', error.message);
    });
    
    return true;
  } catch (error) {
    console.warn('⚠️ Preload check failed:', error.message);
    return false;
  }
}

// === MAIN CREATE FOLDER FUNCTION ===
function createPlayerSaveFolder() {
  console.log('🎯 createPlayerSaveFolder called');
  
  // Use async function inside
  return (async function() {
    const statusEl = document.getElementById('drive-status');
    if (!statusEl) {
      console.error('Drive status element not found');
      return;
    }
    
    // Clear any previous status
    statusEl.innerHTML = '';
    
    try {
      // Check login first
      const { data: { session } } = await sb.auth.getSession();
      if (!session || !session.provider_token) {
        throw new Error('Please login with Google first!');
      }
      
      // Show loading state
      statusEl.innerHTML = `
        <div class="drive-status">
          🚀 Starting Google Drive process...
          <br><small>This may take a few seconds</small>
        </div>
      `;
      
      // Step 1: Ensure Drive API is initialized (with progress)
      statusEl.innerHTML = `
        <div class="drive-status">
          🔄 Initializing Google Drive API...
          <br><small>Step 1/3: Loading required libraries</small>
        </div>
      `;
      
      await ensureDriveInitialized();
      
      // Step 2: Set authentication token
      statusEl.innerHTML = `
        <div class="drive-status">
          🔐 Authenticating with Google...
          <br><small>Step 2/3: Setting up permissions</small>
        </div>
      `;
      
      window.gapi.auth.setToken({
        access_token: session.provider_token,
        expires_at: Date.now() + 3600000 // 1 hour from now
      });
      
      // Step 3: Create folder
      statusEl.innerHTML = `
        <div class="drive-status">
          📁 Creating your game folder...
          <br><small>Step 3/3: Setting up save location</small>
        </div>
      `;
      
      const drive = window.gapi.client.drive;
      
      // 1. Create appDataFolder "HorseGame" (HIDDEN)
      const folderMetadata = {
        name: 'HorseGame',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['appDataFolder']
      };

      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id,name'
      });

      const folderId = folder.result.id;
      
      // 2. Create test.md with timestamp
      const timestamp = new Date().toISOString();
      const testContent = `# GlassHorses Save File\n\n**Created:** ${timestamp}\n**Player:** ${session.user.user_metadata.full_name || session.user.email}\n**Folder ID:** ${folderId}`;

      const fileMetadata = {
        name: 'test.md',
        parents: [folderId]
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: {
          mimeType: 'text/plain',
          body: testContent
        },
        fields: 'id'
      });

      // Success message
      statusEl.innerHTML = `
        <div class="drive-success">
          🎉 SUCCESS! Drive folder + test.md created!
          <br><strong>Folder ID:</strong> ${folderId}
          <br><strong>File ID:</strong> ${file.result.id}
          <br><strong>Created:</strong> ${timestamp}
          <br><small>✅ Hidden in Google Drive appDataFolder</small>
          <br><br>
          <em>Next time will be much faster! 🚀</em>
        </div>
      `;

      console.log('✅ Drive folder created:', folderId, 'File:', file.result.id);
      
      // Store the folder ID for future use
      localStorage.setItem('drive_folder_id', folderId);
      
    } catch (error) {
      console.error('❌ Drive error:', error);
      
      // Handle specific error cases
      let errorMessage = error.message || 'Unknown error';
      let errorDetails = '';
      
      if (errorMessage.includes('token')) {
        errorDetails = '<br><small>Your session may have expired. Try logging out and back in.</small>';
      } else if (errorMessage.includes('load')) {
        errorDetails = '<br><small>Google Drive API failed to load. Check your internet connection.</small>';
      } else if (errorMessage.includes('permission')) {
        errorDetails = '<br><small>Please ensure you granted Drive permissions during login.</small>';
      }
      
      statusEl.innerHTML = `
        <div class="drive-error">
          ❌ Drive Error: ${errorMessage}
          ${errorDetails}
          <br><small>Open F12 console for full details</small>
        </div>
      `;
      
      // Clear initialization cache on certain errors
      if (errorMessage.includes('token') || errorMessage.includes('auth')) {
        window.driveInitializationPromise = null;
        localStorage.removeItem('drive_last_init');
      }
    }
  })();
}

// === CHECK FOR EXISTING FOLDER ===
async function checkExistingDriveFolder() {
  try {
    const folderId = localStorage.getItem('drive_folder_id');
    if (!folderId) return null;
    
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) return null;
    
    // Try to access the folder to verify it still exists
    await ensureDriveInitialized();
    window.gapi.auth.setToken({
      access_token: session.provider_token
    });
    
    const drive = window.gapi.client.drive;
    const response = await drive.files.get({
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

// === CRITICAL: EXPORT ALL FUNCTIONS TO GLOBAL SCOPE ===
// Execute immediately when script loads
(function() {
  // Main function - attach to window immediately
  window.createPlayerSaveFolder = createPlayerSaveFolder;
  
  // Helper functions
  window.preloadGoogleDrive = preloadGoogleDrive;
  window.checkExistingDriveFolder = checkExistingDriveFolder;
  window.ensureDriveInitialized = ensureDriveInitialized;
  
  // Debug functions
  window.getDriveStatus = () => ({
    gapiLoaded: !!window.gapi,
    gapiInited: window.gapiInited,
    driveInitializationPromise: !!window.driveInitializationPromise,
    lastInit: localStorage.getItem('drive_last_init'),
    createPlayerSaveFolder: typeof window.createPlayerSaveFolder
  });
  
  console.log('✅ Drive module loaded and functions exported');
  console.log('📊 Drive status:', window.getDriveStatus());
})();