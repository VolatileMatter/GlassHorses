// === OFFICIAL GOOGLE DRIVE QUICKSTART - GlassHorses ===
const CLIENT_ID = '515090161385-jnmj9bp7p9i6uegdr0lqo5opbte2ivee.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Hide buttons until ready
document.getElementById('authorize_button') && (document.getElementById('authorize_button').style.visibility = 'hidden');
document.getElementById('signout_button') && (document.getElementById('signout_button').style.visibility = 'hidden');
document.getElementById('drive-test-btn') && (document.getElementById('drive-test-btn').style.visibility = 'hidden');

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the discovery doc.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

/**
 * Sign in the user upon button click.
 */
window.handleAuthClick = async function() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('signout_button').style.visibility = 'visible';
    document.getElementById('drive-test-btn').style.visibility = 'visible';
    document.getElementById('authorize_button').innerText = 'Refresh';
    
    // Update UI
    document.getElementById('user-name').textContent = 'Authorized';
    
    // List files to test
    await listFiles();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip account chooser for existing session
    tokenClient.requestAccessToken({prompt: ''});
  }
};

/**
 * Sign out the user upon button click.
 */
window.handleSignoutClick = function() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('content').innerText = '';
    document.getElementById('authorize_button').innerText = 'Authorize Drive';
    document.getElementById('signout_button').style.visibility = 'hidden';
    document.getElementById('drive-test-btn').style.visibility = 'hidden';
    document.getElementById('user-name').textContent = 'Not logged in';
  }
};

/**
 * Print first 10 files.
 */
async function listFiles() {
  let response;
  try {
    response = await gapi.client.drive.files.list({
      'pageSize': 10,
      'fields': 'files(id, name)',
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
  const files = response.result.files;
  if (!files || files.length == 0) {
    document.getElementById('content').innerText = 'No files found.';
    return;
  }
  const output = files.reduce((str, file) => `${str}${file.name} (${file.id})\n`, 'Files:\n');
  document.getElementById('content').innerText = output;
}

// GLASSHORSES: Your createPlayerSaveFolder function (uses official token)
window.createPlayerSaveFolder = async function() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  try {
    if (!gapi.client.getToken()) {
      throw new Error('Please authorize first');
    }
    
    statusEl.innerHTML = '📝 Creating player save folder...';
    
    const response = await gapi.client.drive.files.create({
      resource: {
        name: `GlassHorses_PlayerSave_${Date.now()}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: []  // My Drive root
      },
      fields: 'id,name'
    });
    
    statusEl.innerHTML = `
      <div style="color: green;">
        🎉 SUCCESS! Folder created:<br>
        📁 ${response.result.name}<br>
        🆔 ID: ${response.result.id}
      </div>
    `;
    
  } catch (error) {
    statusEl.innerHTML = `
      <div style="color: red;">
        ❌ ${error.result?.error?.message || error.message}
      </div>
    `;
  }
};

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  const authBtn = document.getElementById('authorize_button');
  const signoutBtn = document.getElementById('signout_button');
  const driveTestBtn = document.getElementById('drive-test-btn');
  
  if (authBtn) authBtn.onclick = window.handleAuthClick;
  if (signoutBtn) signoutBtn.onclick = window.handleSignoutClick;
  if (driveTestBtn) driveTestBtn.onclick = window.createPlayerSaveFolder;
});

// EXPOSE GLOBAL FUNCTIONS
window.signInWithGoogle = window.handleAuthClick;
window.signOut = window.handleSignoutClick;
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;