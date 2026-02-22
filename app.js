// === MAIN APPLICATION ===

// === ENSURE STATUS OVERLAY EXISTS ===
function ensureStatusOverlay() {
  let overlay = document.getElementById('status-overlay');
  if (!overlay) {
    console.log('⚠️ Status overlay missing - creating dynamically');
    const canvasWrap = document.getElementById('canvas-wrap');
    if (canvasWrap) {
      overlay = document.createElement('div');
      overlay.id = 'status-overlay';
      overlay.style.cssText = 'display:none;position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(20,20,30,0.95);backdrop-filter:blur(8px);color:#e0e0e0;z-index:1000;overflow-y:auto;padding:20px;border-radius:12px;border:2px solid rgba(0,255,255,0.3);box-shadow:inset 0 0 30px rgba(138,43,226,0.3);font-family:"Segoe UI",sans-serif;';
      overlay.innerHTML = `
        <div style="font-size:1.2em; font-weight:bold; color:#00ffff; margin-bottom:15px; padding-bottom:5px; border-bottom:2px solid rgba(255,0,255,0.3);">
          Status Panel
        </div>
        <div style="color:#aaa; text-align:center; padding:20px;">
          Loading horse data...
        </div>
      `;
      canvasWrap.appendChild(overlay);
      console.log('✅ Status overlay created successfully');
    } else {
      console.error('❌ Cannot create overlay - canvas-wrap not found');
    }
  }
  return overlay;
}

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
function initializeApp() {
  console.log('Initializing app...');
  
  // Ensure status overlay exists
  ensureStatusOverlay();
  
  // Check if all required modules are loaded
  if (!window.GrazeModule || !window.HorseManager) {
    console.log('Waiting for modules...');
    setTimeout(initializeApp, 100);
    return;
  }
  
  const canvasWrap = document.getElementById('canvas-wrap');
  if (!canvasWrap) {
    console.log('Waiting for canvas...');
    setTimeout(initializeApp, 100);
    return;
  }
  
  console.log('All systems ready, starting app');
  
  // Set up HorseManager change handler
  if (window.HorseManager && window.onHerdChange) {
    window.HorseManager.onChange(window.onHerdChange);
  }
  
  // Load debug herds (already does this by default, but ensure it's loaded)
  if (window.HorseManager && !window.HorseManager.getHorses().length) {
    window.HorseManager.loadDebugHerds();
  }
  
  // Initialize the mode UI (this will set up graze mode and hide graze button)
  if (window.initializeModeUI) {
    window.initializeModeUI();
  }
  
  console.log('App initialized successfully');
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