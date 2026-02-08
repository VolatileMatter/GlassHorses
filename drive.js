// === GOOGLE DRIVE MODULE ===

// === GOOGLE DRIVE INIT ===
async function initGoogleDrive() {
  if (gapiInited) return;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: false,
            discoveryDocs: ['https://www.googleapis.com/discovery/v3/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.appdata'
          });
          gapiInited = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// === CREATE PLAYER SAVE FOLDER + test.md ===
async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  statusEl.innerHTML = '🔄 Initializing Google Drive...';
  
  try {
    // Check login
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      throw new Error('Please login with Google first!');
    }

    await initGoogleDrive();
    statusEl.innerHTML = '📁 Creating HorseGame folder...';

    // Set OAuth token from Supabase Google session
    await gapi.auth.setToken({
      access_token: session.provider_token
    });

    const drive = gapi.client.drive;

    // 1. Create appDataFolder "HorseGame" (HIDDEN from Drive UI)
    const folderMetadata = {
      name: 'HorseGame',
      mimeType: 'application/vnd.google-apps.folder',
      appProperties: {
        folderType: 'horseGameSaves'
      }
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id,name'
    });

    const folderId = folder.result.id;
    statusEl.innerHTML = `✅ Folder created! ID: ${folderId}<br>📄 Creating test.md...`;

    // 2. Create test.md with timestamp
    const timestamp = new Date().toISOString();
    const testContent = `# GlassHorses Save File\n\n**Created:** ${timestamp}\n**Player:** ${session.user.user_metadata.full_name || session.user.email}\n**Folder ID:** ${folderId}\n\n---\n\nTest save file created successfully!\nYour horse DNA, gold, and stable will be stored here.`;

    const fileMetadata = {
      name: 'test.md',
      parents: [folderId]
    };

    await drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: 'text/markdown',
        body: testContent
      },
      fields: 'id'
    });

    statusEl.innerHTML = `
      <div class="drive-success">
        ✅ SUCCESS! Drive folder + test.md created!
        <br><strong>Folder ID:</strong> ${folderId}
        <br><strong>Created:</strong> ${timestamp}
        <br><small>Check Google Takeout → Drive → Other → HorseGame folder</small>
      </div>
    `;

    console.log('✅ Drive folder created:', folderId);
    
  } catch (error) {
    console.error('Drive error:', error);
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ Drive Error: ${error.message || error.body?.error?.message || 'Unknown error'}
        <br><small>Open F12 console for full details</small>
      </div>
    `;
  }
}