// === MAIN APPLICATION ===

// === WAIT FOR ALL SCRIPTS TO LOAD ===
function waitForScripts() {
  return new Promise((resolve) => {
    if (window.appLoaded) {
      resolve(true);
      return;
    }
    
    document.addEventListener('allScriptsLoaded', () => {
      resolve(true);
    });
    
    setTimeout(() => {
      console.warn('Script loading timeout, proceeding anyway');
      resolve(false);
    }, 5000);
  });
}

// === INITIALIZATION ===
function initializeApp() {
  console.log('Initializing app...');
  
  if (!window.GrazeModule || !window.HorseManager) {
    setTimeout(initializeApp, 100);
    return;
  }
  
  const canvasWrap = document.getElementById('canvas-wrap');
  if (!canvasWrap) {
    setTimeout(initializeApp, 100);
    return;
  }
  
  console.log('All systems ready');
  
  if (window.HorseManager && window.onHerdChange) {
    window.HorseManager.onChange(window.onHerdChange);
  }
  
  if (window.HorseManager && !window.HorseManager.getHorses().length) {
    window.HorseManager.loadDebugHerds();
  }
  
  if (window.initializeModeUI) {
    window.initializeModeUI();
  }
}

// === PAGE LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  setTimeout(initializeApp, 100);
});

// === ERROR HANDLING ===
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  if (event.message && (
    event.message.includes('Failed to fetch') ||
    event.message.includes('NetworkError')
  )) {
    console.warn('Network error');
    return;
  }
  
  if (event.message && event.message.includes('createPlayerSaveFolder')) {
    const statusEl = document.getElementById('drive-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="drive-error">
          Google Drive module failed to load
          <br><button onclick="window.location.reload()" style="margin-top: 10px;">Refresh Page</button>
        </div>
      `;
    }
  }
});

// === MANUAL RELOAD FUNCTION ===
if (typeof window !== 'undefined') {
  window.reloadDriveModule = function() {
    console.log('Reloading Drive module...');
    
    if (typeof driveInitializationPromise !== 'undefined') {
      driveInitializationPromise = null;
    }
    localStorage.removeItem('drive_last_init');
    
    const statusEl = document.getElementById('drive-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="drive-status">
          Reloading Google Drive module...
        </div>
      `;
    }
    
    setTimeout(() => {
      if (window.ensureDriveInitialized) {
        window.ensureDriveInitialized().then(() => {
          if (statusEl) {
            statusEl.innerHTML = `
              <div class="drive-success">
                Google Drive module reloaded
              </div>
            `;
          }
        }).catch(error => {
          if (statusEl) {
            statusEl.innerHTML = `
              <div class="drive-error">
                Failed to reload: ${error.message}
              </div>
            `;
          }
        });
      }
    }, 500);
  };
}