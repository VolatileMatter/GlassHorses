// === PURE GOOGLE AUTH - NO SUPABASE LOGIN ===

// CONFIG - Replace with your actual Google Client ID from console.cloud.google.com
const GOOGLE_CLIENT_ID = '515090161385-jnmj9bp7p9i6uegdr0lqo5opbte2ivee.apps.googleusercontent.com';

let authInstance = null;

// === INIT GOOGLE AUTH ===
async function initGoogleAuth() {
  if (authInstance) return authInstance;
  
  // Load platform.js first
  await new Promise((resolve) => {
    if (window.gapi?.auth2) return resolve();
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/platform.js';
    script.async = true;
    script.onload = () => gapi.load('auth2', resolve);
    document.head.appendChild(script);
  });
  
  // Initialize with Drive scopes
  authInstance = await new Promise((resolve) => {
    gapi.auth2.init({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
    }).then(resolve);
  });
  
  return authInstance;
}

// === CHECK AUTH STATE ===
async function getCurrentUser() {
  const auth = await initGoogleAuth();
  const user = auth.isSignedIn.get() ? auth.currentUser.get() : null;
  
  if (user) {
    const profile = user.getBasicProfile();
    return {
      email: profile.getEmail(),
      name: profile.getName(),
      picture: profile.getImageUrl(),
      token: user.getAuthResponse().access_token
    };
  }
  return null;
}

// === LOGIN ===
async function signInWithGoogle() {
  const loginBtn = document.getElementById('login-btn');
  const originalText = loginBtn.textContent;
  
  try {
    loginBtn.textContent = '🔄 Signing in...';
    loginBtn.disabled = true;
    
    const auth = await initGoogleAuth();
    await auth.signIn();
    
    const user = await getCurrentUser();
    updateAuthUI(user);
    
    // Initialize Drive with this token
    if (window.GlassHorsesDrive) {
      window.GlassHorsesDrive.driveToken = user.token;
    }
    
    loadGallery();
    console.log('✅ Google login success:', user.email);
    
  } catch (error) {
    console.error('Login failed:', error);
    alert('Google login failed: ' + error.error);
  } finally {
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
  }
}

// === LOGOUT ===
async function signOut() {
  const logoutBtn = document.getElementById('logout-btn');
  const originalText = logoutBtn.textContent;
  
  try {
    logoutBtn.textContent = '🔄 Signing out...';
    logoutBtn.disabled = true;
    
    const auth = await initGoogleAuth();
    await auth.signOut();
    
    updateAuthUI(null);
    window.GlassHorsesDrive = null;
    
    const statusEl = document.getElementById('drive-status');
    if (statusEl) statusEl.innerHTML = '';
    
    console.log('✅ Signed out');
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    logoutBtn.textContent = originalText;
    logoutBtn.disabled = false;
  }
}

// === UPDATE UI ===
function updateAuthUI(user) {
  const userNameEl = document.getElementById('user-name');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (user) {
    userNameEl.textContent = user.name || user.email || 'Logged in';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    userNameEl.textContent = 'Not logged in';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

// === AUTO-RESTORE SESSION ===
async function restoreSession() {
  const user = await getCurrentUser();
  if (user) {
    updateAuthUI(user);
    window.GlassHorsesDrive = { driveToken: user.token };
    loadGallery();
  }
}

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔧 Setting up Google auth...');
  
  // Login button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.addEventListener('click', signInWithGoogle);
  
  // Logout button  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', signOut);
  
  // Drive test button
  const driveTestBtn = document.getElementById('drive-test-btn');
  if (driveTestBtn) {
    driveTestBtn.addEventListener('click', () => {
      if (window.createPlayerSaveFolder) {
        window.createPlayerSaveFolder();
      } else {
        alert('Drive module not loaded');
      }
    });
  }
  
  // Restore session
  await restoreSession();
});

// Sign-in status listener
if (window.gapi?.auth2) {
  gapi.auth2.getAuthInstance().isSignedIn.listen((signedIn) => {
    if (signedIn) restoreSession();
  });
}

// === EXPOSE GLOBALS ===
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;