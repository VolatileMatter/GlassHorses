// === GOOGLE SIGN-IN v2 (GSI) - NO DEPRECATED LIBRARIES ===
const GOOGLE_CLIENT_ID = '515090161385-jnmj9bp7p9i6uegdr0lqo5opbte2ivee.apps.googleusercontent.com';

let googleUser = null;

// === INIT GSI ===
function initGoogleSignIn() {
  // Load GSI script
  if (document.getElementById('gisi')) return;
  
  const script = document.createElement('script');
  script.id = 'gisi';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = initGSIClient;
  document.head.appendChild(script);
}

// === GSI CLIENT SETUP ===
function initGSIClient() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
    callback: handleGoogleSignIn,
    auto_select: false,
    cancel_on_tap_outside: false
  });
  
  // Render button
  google.accounts.id.renderButton(
    document.getElementById('login-btn'),
    { theme: 'outline', size: 'large', text: 'signin_with' }
  );
  
  // Check existing session
  google.accounts.id.getLastError();
  restoreSession();
}

// === SIGN IN CALLBACK ===
function handleGoogleSignIn(response) {
  try {
    // Decode JWT token
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    
    googleUser = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      token: payload.at_hash || payload.jti // Use access token from credential
    };
    
    // Get Drive token separately for API calls
    initDriveToken();
    
    updateAuthUI(googleUser);
    loadGallery();
    console.log('✅ GSI login:', googleUser.email);
    
  } catch (error) {
    console.error('GSI decode failed:', error);
  }
}

// === DRIVE TOKEN (SEPARATE) ===
async function initDriveToken() {
  if (window.GlassHorsesDrive?.driveToken) return;
  
  // Load API client for Drive token
  await new Promise(resolve => {
    if (window.gapi?.client) return resolve();
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => gapi.load('client', resolve);
    document.head.appendChild(script);
  });
  
  // Use GSI token for Drive (works with drive.file/appdata scopes)
  window.GlassHorsesDrive = {
    driveToken: googleUser.token,
    initialized: true
  };
}

// === LOGOUT ===
async function signOut() {
  const logoutBtn = document.getElementById('logout-btn');
  const originalText = logoutBtn.textContent;
  
  try {
    logoutBtn.textContent = '🔄 Signing out...';
    
    google.accounts.id.disableAutoSelect();
    google.accounts.id.clearCachedToken();
    
    googleUser = null;
    window.GlassHorsesDrive = null;
    
    updateAuthUI(null);
    
    const statusEl = document.getElementById('drive-status');
    if (statusEl) statusEl.innerHTML = '';
    
  } finally {
    logoutBtn.textContent = originalText;
  }
}

// === UPDATE UI ===
function updateAuthUI(user) {
  const userNameEl = document.getElementById('user-name');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (user) {
    userNameEl.textContent = user.name || user.email;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    userNameEl.textContent = 'Not logged in';
    loginBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
  }
}

// === RESTORE SESSION ===
function restoreSession() {
  // GSI doesn't persist tokens across sessions - always require login
  updateAuthUI(null);
}

// === INIT ON LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Initializing Google Sign-In v2...');
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', signOut);
  
  // Drive test button
  const driveTestBtn = document.getElementById('drive-test-btn');
  if (driveTestBtn) {
    driveTestBtn.addEventListener('click', () => {
      if (window.createPlayerSaveFolder) window.createPlayerSaveFolder();
    });
  }
  
  // Init GSI
  initGoogleSignIn();
});

window.signInWithGoogle = () => google.accounts.id.prompt(); // Trigger login
window.signOut = signOut;
