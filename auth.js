// === AUTHENTICATION MODULE ===

// === SESSION RESTORATION CHECK ===
async function restoreSessionAndPreload() {
  console.log('🔄 Checking for existing session...');
  const { data: { session } } = await sb.auth.getSession();
  
  if (session?.user) {
    console.log('✅ Session restored:', session.user.email);
    
    // Update UI immediately
    updateAuthUI(session);
    
    // Verify Drive function is available
    if (typeof window.createPlayerSaveFolder !== 'function') {
      console.warn('⚠️ createPlayerSaveFolder not available yet, will retry');
      // Retry in 1 second
      setTimeout(() => {
        if (typeof window.createPlayerSaveFolder === 'function') {
          console.log('✅ createPlayerSaveFolder now available');
        } else {
          console.error('❌ createPlayerSaveFolder still not available after retry');
        }
      }, 1000);
    }
    
    // Wait a moment for page to settle, then preload Drive
    setTimeout(() => {
      if (window.preloadGoogleDrive && typeof window.preloadGoogleDrive === 'function') {
        window.preloadGoogleDrive().then(success => {
          if (success) {
            console.log('✅ Drive preload initiated');
          }
        }).catch(error => {
          console.warn('⚠️ Preload failed:', error.message);
        });
      } else {
        console.warn('⚠️ preloadGoogleDrive function not available');
      }
    }, 1000);
    
    return true;
  }
  
  console.log('⚠️ No active session found');
  return false;
}

// === AUTH STATE LISTENER ===
sb.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth state changed:', event, session?.user?.email);
  updateAuthUI(session);
  
  if (session?.user) {
    // Preload Drive when user logs in
    setTimeout(() => {
      if (window.preloadGoogleDrive && typeof window.preloadGoogleDrive === 'function') {
        window.preloadGoogleDrive();
      }
    }, 1000);
  } else {
    // Clear Drive cache on logout
    if (typeof driveInitializationPromise !== 'undefined') {
      console.log('🧹 Clearing Drive cache on logout');
      driveInitializationPromise = null;
    }
    localStorage.removeItem('drive_last_init');
    localStorage.removeItem('drive_folder_id');
  }
});

// === UPDATE UI FUNCTION ===
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
    
    // Clear any drive status
    const statusEl = document.getElementById('drive-status');
    if (statusEl) {
      statusEl.innerHTML = '';
    }
  }
}

// === GOOGLE LOGIN WITH DRIVE SCOPE ===
async function signInWithGoogle() {
  const loginBtn = document.getElementById('login-btn');
  const originalText = loginBtn.textContent;
  
  try {
    loginBtn.textContent = '🔄 Connecting...';
    loginBtn.disabled = true;
    
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile https://www.googleapis.com/auth/drive.appdata',
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
    
    // Clear all local storage related to auth
    localStorage.removeItem('drive_last_init');
    localStorage.removeItem('drive_folder_id');
    
    // Reset Drive state
    if (typeof driveInitializationPromise !== 'undefined') {
      driveInitializationPromise = null;
    }
    
    document.getElementById('drive-status').innerHTML = '';
    console.log('✅ Logged out and cache cleared');
    
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
  
  // Drive test button with enhanced error handling
  const driveTestBtn = document.getElementById('drive-test-btn');
  if (driveTestBtn) {
    driveTestBtn.addEventListener('click', () => {
      console.log('🎯 Drive test button clicked');
      console.log('📊 Drive function status:', {
        createPlayerSaveFolder: typeof window.createPlayerSaveFolder,
        gapi: typeof window.gapi,
        windowLoaded: window.appLoaded
      });
      
      if (typeof window.createPlayerSaveFolder === 'function') {
        window.createPlayerSaveFolder();
      } else {
        console.error('❌ createPlayerSaveFolder function not available');
        
        // Show detailed error to user
        const statusEl = document.getElementById('drive-status');
        if (statusEl) {
          statusEl.innerHTML = `
            <div class="drive-error">
              ❌ Google Drive module not loaded
              <br><small>This can happen if:</small>
              <br>• Page is still loading (wait a moment)
              <br>• Script failed to load (check console F12)
              <br>• Network issue (check connection)
              <br><br>
              <button onclick="window.reloadDriveModule && window.reloadDriveModule()" style="margin-right: 10px;">
                🔄 Retry Loading Drive
              </button>
              <button onclick="window.location.reload()">
                📄 Refresh Page
              </button>
            </div>
          `;
        }
      }
    });
  }
  
  // Check for existing session on page load
  setTimeout(() => {
    restoreSessionAndPreload();
  }, 100);
});

// === EXPORT FUNCTIONS ===
if (typeof window !== 'undefined') {
  window.signInWithGoogle = signInWithGoogle;
  window.signOut = signOut;
  window.restoreSessionAndPreload = restoreSessionAndPreload;
}