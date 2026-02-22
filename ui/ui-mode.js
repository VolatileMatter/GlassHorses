// ui/ui-mode.js
// Mode switching logic

// ==================== MODE MANAGEMENT ====================
let currentMode = null;
window.currentMode = null;

// Cache DOM elements
let domElements = null;
let domReady = false;

// Initialize DOM elements when ready
function initDOMElements() {
  if (domReady) return true;
  
  const elements = {
    overlay: document.getElementById('status-overlay'),
    canvasWrap: document.getElementById('canvas-wrap'),
    statusBtn: document.getElementById('btn-status'),
    grazeBtn: document.getElementById('btn-graze'),
    travelBtn: document.getElementById('btn-travel'),
    sleepBtn: document.getElementById('btn-sleep')
  };
  
  // Check if all required elements exist
  if (elements.overlay && elements.canvasWrap && elements.statusBtn && elements.grazeBtn) {
    domElements = elements;
    domReady = true;
    console.log('UI DOM elements ready');
    return true;
  }
  
  return false;
}

// Wait for DOM to be ready
function ensureDOM(callback) {
  if (initDOMElements()) {
    callback();
  } else {
    console.log('Waiting for DOM elements...');
    setTimeout(() => ensureDOM(callback), 100);
  }
}

window.switchMode = function(mode) {
  console.log('Switching to mode:', mode, 'current:', currentMode);
  
  ensureDOM(() => {
    const elements = domElements;
    
    // If clicking status while already in status mode, close it
    if (mode === 'status' && currentMode === 'status') {
      console.log('Closing status overlay');
      
      // Hide status overlay
      elements.overlay.classList.remove('visible');
      
      // Update button text
      elements.statusBtn.textContent = 'View Status';
      
      // Reactivate graze mode
      if (window.GrazeModule) {
        window.GrazeModule.mount(elements.canvasWrap);
      }
      
      currentMode = 'graze';
      window.currentMode = 'graze';
      
      // Update active button states
      document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
      elements.grazeBtn.classList.add('active');
      
      return;
    }
    
    // If switching to a different mode from status
    if (currentMode === 'status' && mode !== 'status') {
      elements.overlay.classList.remove('visible');
      elements.statusBtn.textContent = 'View Status';
    }
    
    // Unmount current canvas mode
    if (currentMode !== 'status') {
      if (currentMode === 'graze' && window.GrazeModule) window.GrazeModule.unmount();
      if (currentMode === 'travel' && window.TravelGame) window.TravelGame.unmount();
      if (currentMode === 'sleep' && window.SleepModule) window.SleepModule.unmount();
    }

    currentMode = mode;
    window.currentMode = mode;

    // Update button active states
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + mode);
    if (activeBtn) activeBtn.classList.add('active');

    if (mode === 'status') {
      console.log('Showing status overlay');
      elements.overlay.classList.add('visible');
      
      // Update button text
      elements.statusBtn.textContent = 'Close';
      
      // Render status data
      if (window.renderStatusOverlay) {
        setTimeout(() => window.renderStatusOverlay(), 50);
      }
      
      return;
    }

    // Reset status button text
    elements.statusBtn.textContent = 'View Status';

    // Hide status overlay
    elements.overlay.classList.remove('visible');

    // Mount new canvas mode
    if (mode === 'graze' && window.GrazeModule) {
      console.log('Mounting graze mode');
      window.GrazeModule.mount(elements.canvasWrap);
    }
    if (mode === 'travel' && window.TravelGame) {
      console.log('Mounting travel mode');
      window.TravelGame.mount(elements.canvasWrap);
    }
    if (mode === 'sleep' && window.SleepModule) {
      console.log('Mounting sleep mode');
      window.SleepModule.mount(elements.canvasWrap);
    }
  });
};

// Mark this script as loaded
window.scriptsLoaded.uiMode = true;
window.checkAllScriptsLoaded();