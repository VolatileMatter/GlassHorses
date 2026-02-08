// === GSI + DRIVE API TOKEN (Working Solution) ===
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.googleusercontent.com';

let currentUser = null;
let driveToken = null;

// === INIT GSI ===
function initGoogleSignIn() {
  if (document.getElementById('gisi')) return;
  
  const script = document.createElement('script');
  script.id = 'gisi';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = initGSIClient;
  document.head.appendChild(script);
}

function initGSIClient() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false
  });
  
  google.accounts.id.renderButton(
    document.getElementById('g-gsi-button'), // Use dedicated div
    { theme: 'outline', size: 'large', text: 'signin_with' }
  );
}

// === GSI CALLBACK ===
function handleCredentialResponse(response) {
  // Decode ID token for user info
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  currentUser = {
    email: payload.email,
    name: payload.name,
    picture: payload.picture
  };
  
  // Get Drive token using gapi OAuth2
  getDriveAccessToken();
  
  updateAuthUI(currentUser);
  console.log('✅ GSI + Drive auth:', currentUser.email);
}

// === GET DRIVE ACCESS TOKEN ===
async function getDriveAccessToken() {
  // Load gapi OAuth2 client
  await new Promise(resolve => {
    if (window.gapi?.client) return resolve();
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.onload = () => gapi.load('client', resolve);
    document.head.appendChild(script);
  });
  
  // Init OAuth2 client with Drive scopes
  await gapi.client.init({
    clientId: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
    discoveryDocs: ['https://www.googleapis.com/discovery/v3/apis/drive/v3/rest']
  });
  
  const authInstance = gapi.auth2.getAuthInstance();
  if (!authInstance.isSignedIn.get()) {
    await authInstance.signIn({ prompt: 'none' });
  }
  
  driveToken = authInstance.currentUser.get().getAuthResponse().access_token;
  window.GlassHorsesDrive = { driveToken };
  
  console.log('✅ Drive token ready');
}

// === SIMPLIFIED DRIVE.JS ===
window.createPlayerSaveFolder = async function() {
  const statusEl = document.getElementById('drive-status');
  if (!statusEl) return;
  
  try {
    if (!driveToken) throw new Error('Drive not authorized');
    
    statusEl.innerHTML = '🔄 Setting up Drive...';
    
    // Use the Drive token we got above
    gapi.auth.setToken({ access_token: driveToken });
    
    statusEl.innerHTML += '<br>📝 Creating test file...';
    
    const response = await gapi.client.drive.files.create({
      resource: {
        name: `test_${Date.now()}.txt`,
        parents: []  // Root
      },
      media: {
        mimeType: 'text/plain',
        body: 'GlassHorses Drive Test ✅'
      },
      fields: 'id,name'
    });
    
    statusEl.innerHTML = `
      <div style="color: green; font-size: 18px;">
        🎉 SUCCESS! File ID: ${response.result.id}
      </div>
    `;
    
  } catch (error) {
    statusEl.innerHTML = `<div style="color: red;">❌ ${error.message}</div>`;
    console.error(error);
  }
};

// === UI ===
function updateAuthUI(user) {
  document.getElementById('user-name').textContent = user?.name || 'Not logged in';
  document.getElementById('g-gsi-button')?.style.setProperty('display', user ? 'none' : 'block');
  document.getElementById('logout-btn')?.style.setProperty('display', user ? 'inline-block' : 'none');
}

async function signOut() {
  if (gapi?.auth2?.getAuthInstance()) {
    await gapi.auth2.getAuthInstance().signOut();
  }
  google.accounts.id.disableAutoSelect();
  currentUser = null;
  driveToken = null;
  updateAuthUI(null);
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initGoogleSignIn();
  
  document.getElementById('logout-btn')?.addEventListener('click', signOut);
});

window.signOut = signOut;