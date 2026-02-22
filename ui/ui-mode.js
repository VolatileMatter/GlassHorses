// ui/ui-mode.js
// Mode switching logic with button hiding

// ==================== MODE MANAGEMENT ====================
let currentMode = null;
window.currentMode = null;

// Cache DOM elements
let domElements = null;
let domReady = false;

// Initialize DOM elements when ready
function initDOMElements() {
  if (domReady) return true;
  
  console.log('Looking for DOM elements...');
  
  const elements = {
    overlay: document.getElementById('status-overlay'),
    canvasWrap: document.getElementById('canvas-wrap'),
    statusBtn: document.getElementById('btn-status'),
    grazeBtn: document.getElementById('btn-graze'),
    travelBtn: document.getElementById('btn-travel'),
    sleepBtn: document.getElementById('btn-sleep'),
    actionBar: document.getElementById('action-bar')
  };
  
  // Log what we found
  console.log('Found elements:', {
    overlay: !!elements.overlay,
    canvasWrap: !!elements.canvasWrap,
    statusBtn: !!elements.statusBtn,
    grazeBtn: !!elements.grazeBtn,
    travelBtn: !!elements.travelBtn,
    sleepBtn: !!elements.sleepBtn,
    actionBar: !!elements.actionBar
  });
  
  // Check if all required elements exist
  if (elements.overlay && elements.canvasWrap && elements.statusBtn && elements.grazeBtn && elements.actionBar) {
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

// Show all action buttons
function showAllButtons() {
  if (!domElements) return;
  domElements.grazeBtn.style.display = 'inline-block';
  domElements.statusBtn.style.display = 'inline-block';
  domElements.travelBtn.style.display = 'inline-block';
  domElements.sleepBtn.style.display = 'inline-block';
}

// Hide all action buttons
function hideAllButtons() {
  if (!domElements) return;
  domElements.grazeBtn.style.display = 'none';
  domElements.statusBtn.style.display = 'none';
  domElements.travelBtn.style.display = 'none';
  domElements.sleepBtn.style.display = 'none';
}

window.switchMode = function(mode) {
  console.log('Switching to mode:', mode, 'current:', currentMode);
  
  ensureDOM(() => {
    const elements = domElements;
    
    // If clicking the same mode button, do nothing
    if (mode === currentMode) {
      console.log('Already in this mode, ignoring');
      return;
    }
    
    // Handle leaving current mode
    if (currentMode === 'status') {
      // Leaving status mode
      elements.overlay.classList.remove('visible');
    } else if (currentMode) {
      // Leaving a canvas mode (graze, travel, sleep)
      if (currentMode === 'graze' && window.GrazeModule) window.GrazeModule.unmount();
      if (currentMode === 'travel' && window.TravelGame) window.TravelGame.unmount();
      if (currentMode === 'sleep' && window.SleepModule) window.SleepModule.unmount();
    }

    // Set new mode
    currentMode = mode;
    window.currentMode = mode;

    // Hide all buttons first
    hideAllButtons();
    
    // Show all buttons EXCEPT the current mode's button
    if (mode !== 'graze') elements.grazeBtn.style.display = 'inline-block';
    if (mode !== 'status') elements.statusBtn.style.display = 'inline-block';
    if (mode !== 'travel') elements.travelBtn.style.display = 'inline-block';
    if (mode !== 'sleep') elements.sleepBtn.style.display = 'inline-block';

    // Handle entering new mode
    if (mode === 'status') {
      console.log('Showing status overlay');
      elements.overlay.classList.add('visible');
      
      // Render status data
      if (window.renderStatusOverlay) {
        setTimeout(() => window.renderStatusOverlay(), 50);
      }
    } else {
      // Entering a canvas mode
      elements.overlay.classList.remove('visible');
      
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
    }
  });
};

// Initialize default state (graze mode active, hide graze button)
window.initializeModeUI = function() {
  ensureDOM(() => {
    const elements = domElements;
    
    // Start in graze mode
    currentMode = 'graze';
    window.currentMode = 'graze';
    
    // Mount graze module
    if (window.GrazeModule) {
      window.GrazeModule.mount(elements.canvasWrap);
    }
    
    // Hide all buttons first
    hideAllButtons();
    
    // Show all buttons EXCEPT graze
    elements.statusBtn.style.display = 'inline-block';
    elements.travelBtn.style.display = 'inline-block';
    elements.sleepBtn.style.display = 'inline-block';
    
    console.log('Mode UI initialized - Graze active, graze button hidden');
  });
};

// Mark this script as loaded
if (typeof window.scriptsLoaded !== 'undefined') {
  window.scriptsLoaded.uiMode = true;
  if (window.checkAllScriptsLoaded) window.checkAllScriptsLoaded();
}