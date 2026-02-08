// === FIXED GOOGLE DRIVE MODULE ===

// Global flag
let gapiInited = false;

// === FIXED GOOGLE DRIVE INIT ===
async function initGoogleDrive() {
  if (gapiInited) return true;
  
  // Step 1: Load Google API script if not loaded
  if (!window.gapi) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  // Step 2: Load client library and Drive API v3
  await new Promise((resolve, reject) => {
    window.gapi.load('client', async () => {
      try {
        // Load Drive API v3 discovery document
        await window.gapi.client.load('drive', 'v3');
        gapiInited = true;
        console.log('✅ Google Drive API initialized');
        resolve(true);
      } catch (error) {
        reject(new Error('Failed to load Drive API: ' + error.message));
      }
    });
  });
  
  return true;
}

// === FIXED CREATE PLAYER SAVE FOLDER + test.md ===
// IMPORTANT: This function MUST be defined in global scope
window.createPlayerSaveFolder = async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) {
    console.error('Drive status element not found');
    return;
  }
  
  statusEl.innerHTML = '🔄 Initializing Google Drive...';
  
  try {
    // Check login
    const { data: { session } } = await sb.auth.getSession();
    if (!session || !session.provider_token) {
      throw new Error('Please login with Google first!');
    }

    // Initialize Drive API
    await initGoogleDrive();
    statusEl.innerHTML = '🔐 Authenticating...';

    // Set the OAuth token from Supabase session (CRITICAL)
    window.gapi.auth.setToken({
      access_token: session.provider_token
    });

    const drive = window.gapi.client.drive;
    statusEl.innerHTML = '📁 Creating HorseGame folder...';

    // 1. Create appDataFolder "HorseGame" (HIDDEN)
    const folderMetadata = {
      name: 'HorseGame',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['appDataFolder']  // Puts in hidden appDataFolder
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id,name'
    });

    const folderId = folder.result.id;
    statusEl.innerHTML = `✅ Folder created! ID: ${folderId}<br>📄 Creating test.md...`;

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

    statusEl.innerHTML = `
      <div class="drive-success">
        ✅ SUCCESS! Drive folder + test.md created!
        <br><strong>Folder ID:</strong> ${folderId}
        <br><strong>File ID:</strong> ${file.result.id}
        <br><strong>Created:</strong> ${timestamp}
        <br><small>✅ Hidden in Google Drive appDataFolder (check Takeout)</small>
      </div>
    `;

    console.log('✅ Drive folder created:', folderId, 'File:', file.result.id);
    
  } catch (error) {
    console.error('Drive error:', error);
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ Drive Error: ${error.message || 'Unknown error'}
        <br><small>Open F12 console for full details</small>
      </div>
    `;
  }
};

// === EXPORT FUNCTION TO GLOBAL SCOPE (Backup) ===
// Also attach to window object for safety
if (typeof window !== 'undefined') {
  window.createPlayerSaveFolder = window.createPlayerSaveFolder || createPlayerSaveFolder;
}

console.log('✅ Drive module loaded, createPlayerSaveFolder function available:', typeof window.createPlayerSaveFolder);