// === OFFICIAL GOOGLE DRIVE QUICKSTART - GlassHorses ===
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Explicitly attach to window so index.html can see them
window.gapiLoaded = function() {
  gapi.load('client', initializeGapiClient);
};
window.gisLoaded = function() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID, // This will now correctly use the one from config.js
    scope: SCOPES,
    callback: '', 
  });
  gisInited = true;
  maybeEnableButtons();
};

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
    const authBtn = document.getElementById('authorize_button');
    if (authBtn) {
      authBtn.style.display = 'inline-block';
    }
    const userName = document.getElementById('user-name');
    if (userName) {
      userName.textContent = 'Ready to Login';
    }
  }
}

/**
 * Sign in the user upon button click.
 */
window.handleAuthClick = function() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    
    // Update UI for logged-in state
    document.getElementById('signout_button').style.display = 'inline-block';
    document.getElementById('authorize_button').innerText = '🔄 Refresh Token';
    document.getElementById('drive-test-btn').style.display = 'inline-block';
    document.getElementById('user-name').textContent = '✅ Authorized';

    // Store token for drive.js to access
    window.GlassHorsesDrive = {
      driveToken: resp.access_token
    };

    // Optional: list files to verify access
    const content = document.getElementById('content');
    if (content) {
      content.style.display = 'block';
      await listFiles();
    }
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
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
    
    // Reset UI
    document.getElementById('content').innerText = '';
    document.getElementById('content').style.display = 'none';
    document.getElementById('authorize_button').innerText = '🔐 Authorize Drive';
    document.getElementById('signout_button').style.display = 'none';
    document.getElementById('drive-test-btn').style.display = 'none';
    document.getElementById('user-name').textContent = 'Not logged in';
    
    // Clear the internal drive object
    window.GlassHorsesDrive = null;
  }
};

/**
 * Print metadata for files in the user's Drive.
 */
async function listFiles() {
  let response;
  try {
    response = await gapi.client.drive.files.list({
      pageSize: 10,
      fields: 'files(id, name)',
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
  const files = response.result.files;
  if (!files || files.length === 0) {
    document.getElementById('content').innerText = 'No files found.';
    return;
  }
  const output = files.reduce(
    (str, file) => `${str}${file.name} (${file.id})\n`,
    'Files found in your Drive:\n'
  );
  document.getElementById('content').innerText = output;
}

// Attach event listeners when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const authBtn = document.getElementById('authorize_button');
  const signoutBtn = document.getElementById('signout_button');
  const driveTestBtn = document.getElementById('drive-test-btn');
  
  if (authBtn) authBtn.onclick = window.handleAuthClick;
  if (signoutBtn) signoutBtn.onclick = window.handleSignoutClick;
  if (driveTestBtn) driveTestBtn.onclick = window.createPlayerSaveFolder;
});