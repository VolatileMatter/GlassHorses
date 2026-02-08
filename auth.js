// === AUTHENTICATION MODULE ===

// === SESSION RESTORATION ===
async function restoreSessionAndPreload() {
  console.log('🔄 Checking for existing session...');
  const { data: { session } } = await sb.auth.getSession();
  
  if (session?.user) {
    console.log('✅ Session restored:', session.user.email);
    updateAuthUI(session);
    
    // Start Drive preload after a short delay
    setTimeout(() => {
      if (window.preloadGoogleDrive) {
        window.preloadGoogleDrive();
      }
    }, 500);
    
    return true;
  }
  
  return false;
}

// === AUTH STATE LISTENER ===
sb.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth state changed:', event, session?.user?.email);
  updateAuthUI(session);
  
  if (session?.user) {
    // Preload Drive on login
    setTimeout(() => {
      if (window.preloadGoogleDrive) {
        window.preloadGoogleDrive();
      }
    }, 1000);
  } else {
    // Clear Drive cache on logout
    if (window.GlassHorsesDrive) {
      window.GlassHorsesDrive.initializationPromise = null;
    }
    localStorage.removeItem('drive_last_init');
    localStorage.removeItem('drive_folder_id');
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
    
    const statusEl = document.getElementById('drive-status');
    if (statusEl) statusEl.innerHTML = '';
  }
}

// === GOOGLE LOGIN ===
async function signInWithGoogle() {
  const loginBtn = document.getElementById('login-btn');
  const originalText = loginBtn.textContent;
  
  try {
    loginBtn.textContent = '🔄 Connecting...';
    loginBtn.disabled = true;
    
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/drive.appdata',
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
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
    
    await sb.auth.signOut();
    
    // Clear Drive state
    if (window.GlassHorsesDrive) {
      window.GlassHorsesDrive.initializationPromise = null;
    }
    localStorage.removeItem('drive_last_init');
    localStorage.removeItem('drive_folder_id');
    
    document.getElementById('drive-status').innerHTML = '';
    console.log('✅ Logged out');
    
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed: ' + error.message);
  } finally {
    logoutBtn.textContent = originalText;
    logoutBtn.disabled = false;
  }
}

// === SETUP EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Setting up auth event listeners...');
  
  // Login button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', signInWithGoogle);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', signOut);
  }
  
  // Drive test button
  const driveTestBtn = document.getElementById('drive-test-btn');
  if (driveTestBtn) {
    driveTestBtn.addEventListener('click', () => {
      if (typeof window.createPlayerSaveFolder === 'function') {
        window.createPlayerSaveFolder();
      } else {
        alert('Google Drive module not loaded. Please refresh the page.');
      }
    });
  }
  
  // Breed button
  const breedBtn = document.getElementById('breed-btn');
  if (breedBtn) {
    breedBtn.addEventListener('click', () => {
      alert('Horse breeding coming soon!');
    });
  }
  
  // Check for existing session
  setTimeout(() => {
    restoreSessionAndPreload();
  }, 100);
});

// === EXPORT FUNCTIONS ===
if (typeof window !== 'undefined') {
  window.signInWithGoogle = signInWithGoogle;
  window.signOut = signOut;
}