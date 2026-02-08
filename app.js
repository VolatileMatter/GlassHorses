// === MAIN APPLICATION ===

// === WAIT FOR ALL SCRIPTS TO LOAD ===
function waitForScripts() {
  return new Promise((resolve) => {
    if (window.appLoaded) {
      resolve(true);
      return;
    }
    
    // Listen for our custom event
    document.addEventListener('allScriptsLoaded', () => {
      resolve(true);
    });
    
    // Fallback timeout
    setTimeout(() => {
      console.warn('⚠️ Script loading timeout, proceeding anyway');
      resolve(false);
    }, 5000);
  });
}

// === INITIALIZATION ===
async function initializeApp() {
  console.log('🚀 GlassHorses app initializing...');
  
  try {
    // Wait for all scripts to load first
    const scriptsReady = await waitForScripts();
    if (!scriptsReady) {
      console.warn('⚠️ Some scripts may not have loaded properly');
    }
    
    // Check authentication state
    const { data: { session } } = await sb.auth.getSession();
    console.log('🔐 Session check:', session ? 'Active' : 'No session');
    
    // Load gallery (will show public content)
    await loadGallery();
    
    // Log available functions for debugging
    console.log('✅ App initialization check:');
    console.log('  createPlayerSaveFolder:', typeof window.createPlayerSaveFolder);
    console.log('  signInWithGoogle:', typeof window.signInWithGoogle);
    console.log('  loadGallery:', typeof loadGallery);
    console.log('  gapi:', typeof window.gapi);
    console.log('  scriptsLoaded:', window.scriptsLoaded);
    
    // Set up breed button
    const breedBtn = document.getElementById('breed-btn');
    if (breedBtn) {
      breedBtn.addEventListener('click', () => {
        alert('Horse breeding logic coming in the next update! 🐎');
      });
    }
    
    // Show app ready state
    console.log('✅ App initialized successfully');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    
    // Show user-friendly error
    const galleryEl = document.getElementById('gallery-list');
    if (galleryEl) {
      galleryEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
          <h3>Application Error</h3>
          <p>Failed to initialize. Please refresh the page.</p>
          <p><small>Error: ${error.message}</small></p>
          <button onclick="window.location.reload()" style="margin-top: 20px;">🔄 Refresh Page</button>
        </div>
      `;
    }
  }
}

// === PAGE LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, waiting for scripts...');
  
  // Initialize with a small delay to ensure all scripts are loaded
  setTimeout(() => {
    initializeApp();
  }, 100);
});

// === ERROR HANDLING ===
window.addEventListener('error', (event) => {
  console.error('🌐 Global error caught:', event.error);
  
  // Don't show alert for common network errors
  if (event.message && (
    event.message.includes('Failed to fetch') ||
    event.message.includes('NetworkError') ||
    event.message.includes('Load failed')
  )) {
    console.warn('⚠️ Network error, user might be offline');
    return;
  }
  
  // Show user-friendly message for critical errors
  if (event.message && event.message.includes('createPlayerSaveFolder')) {
    const statusEl = document.getElementById('drive-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="drive-error">
          ❌ Google Drive module failed to load
          <br><small>Please refresh the page and try again</small>
          <br><button onclick="window.location.reload()" style="margin-top: 10px;">🔄 Refresh Page</button>
        </div>
      `;
    }
  }
});

// === MANUAL RELOAD FUNCTION ===
if (typeof window !== 'undefined') {
  window.reloadDriveModule = function() {
    console.log('🔄 Manually reloading Drive module...');
    
    // Clear cache
    if (typeof driveInitializationPromise !== 'undefined') {
      driveInitializationPromise = null;
    }
    localStorage.removeItem('drive_last_init');
    
    // Show status
    const statusEl = document.getElementById('drive-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="drive-status">
          🔄 Reloading Google Drive module...
          <br><small>Please wait</small>
        </div>
      `;
    }
    
    // Re-initialize
    setTimeout(() => {
      if (window.ensureDriveInitialized) {
        window.ensureDriveInitialized().then(() => {
          if (statusEl) {
            statusEl.innerHTML = `
              <div class="drive-success">
                ✅ Google Drive module reloaded!
                <br><small>Try the button again</small>
              </div>
            `;
          }
        }).catch(error => {
          if (statusEl) {
            statusEl.innerHTML = `
              <div class="drive-error">
                ❌ Failed to reload Drive module
                <br><small>${error.message}</small>
              </div>
            `;
          }
        });
      }
    }, 500);
  };
}