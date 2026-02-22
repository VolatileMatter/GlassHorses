// === GOOGLE DRIVE MODULE ===
// Handles player save folder creation and per-herd folder management.
// Root structure in Drive:  GlassHorses/ → herd_<id>/ → save_info.json

// ---- Low-level Drive helper ----
async function _ensureGapiDrive(token) {
  if (!window.gapi) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://apis.google.com/js/api.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  await new Promise(resolve => gapi.load('client', resolve));
  gapi.client.setToken({ access_token: token });
  await gapi.client.load('drive', 'v3');
}

async function _createDriveFolder(token, name, parentId) {
  await _ensureGapiDrive(token);
  const resource = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) resource.parents = [parentId];
  const resp = await gapi.client.drive.files.create({ resource, fields: 'id, name' });
  return resp.result.id;
}

async function _findOrCreateFolder(token, name, parentId) {
  await _ensureGapiDrive(token);
  // Search for existing folder
  let q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const search = await gapi.client.drive.files.list({ q, fields: 'files(id,name)', pageSize: 5 });
  if (search.result.files && search.result.files.length > 0) {
    return search.result.files[0].id;
  }
  return await _createDriveFolder(token, name, parentId);
}

async function _writeJsonFile(token, filename, data, parentId) {
  await _ensureGapiDrive(token);
  await gapi.client.drive.files.create({
    resource: { name: filename, parents: parentId ? [parentId] : [] },
    media: { mimeType: 'application/json', body: JSON.stringify(data, null, 2) },
    fields: 'id',
  });
}

// ---- DriveManager: higher-level API ----
const DriveManager = (() => {
  let _rootFolderId = null; // ID of "GlassHorses" root folder

  function _token() {
    return window.GlassHorsesDrive?.driveToken || null;
  }

  async function _ensureRoot() {
    if (_rootFolderId) return _rootFolderId;
    const token = _token();
    if (!token) throw new Error('Not authorized. Please click "Authorize Drive" first.');
    _rootFolderId = await _findOrCreateFolder(token, 'GlassHorses', null);
    console.log('📁 Drive root folder ID:', _rootFolderId);
    return _rootFolderId;
  }

  /**
   * Creates a herd folder under GlassHorses/<herd_name>/
   * Returns the Drive folder ID, or null on failure.
   */
  async function createHerdFolder(herdMeta) {
    const token = _token();
    if (!token) {
      console.warn('DriveManager: no token — skipping herd folder creation');
      return null;
    }
    try {
      const rootId = await _ensureRoot();
      const safeName = (herdMeta.herd_name || 'unnamed_herd').replace(/[^a-zA-Z0-9 _-]/g, '_');
      const folderId = await _findOrCreateFolder(token, safeName, rootId);

      // Write a herd manifest
      await _writeJsonFile(token, 'herd.json', {
        herd_id: herdMeta.herd_id,
        herd_name: herdMeta.herd_name,
        description: herdMeta.description || '',
        created: herdMeta.created,
        app: 'GlassHorses',
        version: '1.0.0',
        saved: new Date().toISOString(),
      }, folderId);

      console.log(`📁 Herd folder created: "${safeName}" → ${folderId}`);
      return folderId;
    } catch(e) {
      console.error('DriveManager: createHerdFolder failed:', e);
      return null;
    }
  }

  /**
   * Saves all herd data to Drive.
   * Each herd gets its own folder with individual horse JSON files.
   */
  async function saveAllHerds() {
    const token = _token();
    if (!token) throw new Error('Not authorized.');
    if (!window.HorseManager) throw new Error('HorseManager not loaded.');

    const rootId = await _ensureRoot();
    const herds = window.HorseManager.exportForSave();

    for (const { meta, horses } of herds) {
      const safeName = (meta.herd_name || 'unnamed').replace(/[^a-zA-Z0-9 _-]/g, '_');
      const folderId = meta.drive_folder_id || await _findOrCreateFolder(token, safeName, rootId);

      // Write herd manifest
      await _writeJsonFile(token, 'herd.json', { ...meta, saved: new Date().toISOString() }, folderId);

      // Write each horse
      for (const horse of horses) {
        const filename = (horse.barn_name || horse.id || 'horse').replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
        await _writeJsonFile(token, filename, horse, folderId);
      }
    }
    return true;
  }

  return { createHerdFolder, saveAllHerds };
})();

window.DriveManager = DriveManager;

// ---- Legacy: createPlayerSaveFolder (kept for compatibility) ----
window.createPlayerSaveFolder = async function() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  statusEl.innerHTML = '<div class="drive-status">🚀 Connecting to Google Drive...</div>';

  try {
    const token = window.GlassHorsesDrive?.driveToken;
    if (!token) throw new Error('No active session. Please click "Authorize Drive" first.');
    statusEl.innerHTML += '<br>✅ Token verified';

    // Save all herds
    statusEl.innerHTML += '<br>📂 Creating herd folders...';
    await DriveManager.saveAllHerds();

    statusEl.innerHTML = `
      <div class="drive-success">
        🎉 <strong>Drive Saved!</strong><br>
        All herds saved under <code>GlassHorses/</code> in your Drive.<br>
        <small>Each herd has its own folder with individual horse files.</small>
      </div>`;
  } catch(error) {
    console.error('Drive save failed:', error);
    statusEl.innerHTML = `
      <div class="drive-error">
        ❌ <strong>Drive Error</strong><br>${error.message}<br>
        <button onclick="window.createPlayerSaveFolder()" style="margin-top:10px;">🔄 Retry</button>
      </div>`;
  }
};