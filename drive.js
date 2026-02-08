// === GOOGLE DRIVE MODULE - Direct Initialization ===

/**
 * Creates a save folder in the user's Google Drive.
 * Uses direct client loading to avoid 502 Discovery Doc errors.
 */
window.createPlayerSaveFolder = async function createPlayerSaveFolder() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  statusEl.innerHTML = '<div class="drive-status">🚀 Initializing Google Drive...</div>';
  
  try {
    // 1. Validate Token from auth.js bridge
    const token = window.GlassHorsesDrive?.driveToken;
    if (!token) {
      throw new Error('No active session. Please click "Authorize Drive" first.');
    }
    
    statusEl.innerHTML += `<br>✅ Security token verified`;

    // 2. Ensure GAPI base is loaded
    if (!window.gapi) {
      statusEl.innerHTML += `<br>📦 Loading Google Library...`;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // 3. Initialize Client and Load Drive V3 directly
    // Using gapi.client.load avoids the 502 errors often seen with discoveryDocs
    statusEl.innerHTML += `<br>🔧 Connecting to Drive Service...`;
    await new Promise((resolve) => gapi.load('client', resolve));
    
    // Explicitly set the token before loading the service
    gapi.client.setToken({ access_token: token });

    await gapi.client.load('drive', 'v3');
    statusEl.innerHTML += `<br>✅ Drive Service Ready`;

    // 4. Create the Player Save Folder
    statusEl.innerHTML += `<br>📝 Creating save folder...`;
    
    const folderMetadata = {
      'name': `GlassHorses_SaveData`,
      'mimeType': 'application/vnd.google-apps.folder'
    };

    const driveResponse = await gapi.client.drive.files.create({
      resource: folderMetadata,
      fields: 'id, name'
    });

    const folderId = driveResponse.result.id;

    // 5. Create a test file inside that new folder
    statusEl.innerHTML += `<br>📂 Creating initial save file...`;
    
    await gapi.client.drive.files.create({
      resource: {
        name: 'save_info.json',
        parents: [folderId]
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify({
          app: "GlassHorses",
          version: "1.0.0",
          created: new Date().toISOString()
        })
      },
      fields: 'id'
    });

    // Final Success UI
    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 <strong>Drive Connected Successfully!</strong><br>
        📁 Folder Created: ${driveResponse.result.name}<br>
        🆔 ID: ${folderId}<br>
        <small>Your horses will now be saved to the cloud.</small>
      </div>
    `;

  } catch (error) {
    console.error('Drive initialization failed:', error);
    
    // Handle the specific "missing fields" or "502" context
    const errorMessage = error.result?.error?.message || error.message || 'Unknown Network Error';
    
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ <strong>Drive Error</strong><br>
        ${errorMessage}<br>
        <button onclick="window.createPlayerSaveFolder()" style="margin-top:10px;">🔄 Retry Connection</button>
      </div>
    `;
  }
};