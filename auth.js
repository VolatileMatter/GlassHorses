// === AUTHENTICATION MODULE (HYBRID SUPABASE + GAPI DRIVE) ===

// CONFIG - Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.googleusercontent.com'; // From Google Console

// === SESSION RESTORATION ===
async function restoreSessionAndPreload() {
  console.log('🔄 Checking for existing session...');
  const { data: { session } } = await sb.auth.getSession();
  
  if (session?.user) {
    console.log('✅ Session restored:', session.user.email);
    updateAuthUI(session);
    
    // Initialize hybrid Drive auth
    await initGoogleDriveAuth();
    
    return true;
  }
  return false;
}

// === GOOGLE DRIVE AUTH (PARALLEL TO SUPABASE) ===
async function initGoogleDriveAuth() {
  if (window.GlassHorsesDrive?.driveInitialized) return;
  
  try {
    console.log('🔧 Initializing Google Drive auth...');
    
    // Load gapi auth2
    await new Promise((resolve) => {
      if (window.gapi?.auth2) return resolve();
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/platform.js';
      script.async = true;
      script.onload = () => {
        gapi.load('auth2', resolve);
      };
      document.head.appendChild(script);
    });
    
    // Init with Drive scopes
    await gapi.auth2.init({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
    });
    
    // Auto-signin if user already has Google session
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn({ prompt: 'none' });
    }
    
    window.GlassHorsesDrive = window.GlassHorsesDrive || {};
    window.GlassHorsesDrive.driveToken = authInstance.currentUser.get().getAuthResponse().access_token;
    window.GlassHorsesDrive.driveInitialized = true;
    
    console.log('✅ Google Drive auth ready');
  } catch (error) {
    console.warn('Drive auth failed (non-critical):', error);
  }
}

// === AUTH STATE LISTENER ===
sb.auth.onAuthStateChange(async (event, session) => {
  console.log('🔐 Auth state changed:', event, session?.user?.email);
  updateAuthUI(session);
  
  if (session?.user) {
    await initGoogleDriveAuth();
  } else {
    // Clear Drive on logout
    if (window.GlassHorsesDrive) {
      window.GlassHorsesDrive.driveInitialized = false;
      window.GlassHorsesDrive.driveToken = null;
    }
  }
});

// === UPDATE UI ===
function updateAuthUI(session) {
  const userNameEl = document.getElementById('user-name');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (session?.user) {
    userNameEl.textContent = session.user.user_metadata.full_name || session.user.email || 'Logged in';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    loadGallery();
  } else {
    userNameEl.textContent = 'Not logged in';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

// === SUPABASE GOOGLE LOGIN (KEEPS EXISTING FLOW) ===
async function signInWithGoogle() {
  const loginBtn = document.getElementById('login-btn');
  const originalText = loginBtn.textContent;
  
  try {
    loginBtn.textContent = '🔄 Connecting...';
    loginBtn.disabled = true;
    
    // Supabase login (no Drive scopes here - handled by gapi)
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
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
    logoutBtn.textContent = '🔄 Logging out...';
    logoutBtn.disabled = true;
    
    // Sign out from BOTH systems
    await sb.auth.signOut();
    if (gapi?.auth2?.getAuthInstance()?.signOut) {
      await gapi.auth2.getAuthInstance().signOut();
    }
    
    // Clear Drive state
    if (window.GlassHorsesDrive) {
      window.GlassHorsesDrive = { initializationPromise: null };
    }
    
    document.getElementById('drive-status').innerHTML = '';
    console.log('✅ Logged out');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    logoutBtn.textContent = originalText;
    logoutBtn.disabled = false;
  }
}

// === SETUP EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Setting up auth event listeners...');
  
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.addEventListener('click', signInWithGoogle);
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', signOut);
  
  const driveTestBtn = document.getElementById('drive-test-btn');
  if (driveTestBtn) {
    driveTestBtn.addEventListener('click', () => {
      if (typeof window.createPlayerSaveFolder === 'function') {
        window.createPlayerSaveFolder();
      } else {
        alert('Drive module not loaded');
      }
    });
  }
  
  setTimeout(() => restoreSessionAndPreload(), 100);
});

window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;