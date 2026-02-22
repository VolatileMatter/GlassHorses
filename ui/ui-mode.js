// ui/ui-mode.js
// Mode switching logic

// ==================== MODE MANAGEMENT ====================
let currentMode = null;
window.currentMode = null;

// Wait for DOM to be ready before accessing elements
function getRequiredElements() {
  return {
    overlay: document.getElementById('status-overlay'),
    canvasWrap: document.getElementById('canvas-wrap'),
    statusBtn: document.getElementById('btn-status'),
    grazeBtn: document.getElementById('btn-graze')
  };
}

window.switchMode = function(mode) {
  console.log('Switching to mode:', mode, 'current:', currentMode);
  
  const elements = getRequiredElements();
  
  if (!elements.overlay || !elements.canvasWrap) {
    console.log('Waiting for DOM elements to be ready...');
    // Retry after a short delay
    setTimeout(() => window.switchMode(mode), 100);
    return;
  }
  
  // If clicking status while already in status mode, close it
  if (mode === 'status' && currentMode === 'status') {
    console.log('Closing status overlay');
    
    // Hide status overlay
    elements.overlay.classList.remove('visible');
    
    // Update button text
    if (elements.statusBtn) elements.statusBtn.textContent = 'View Status';
    
    // Reactivate graze mode
    if (window.GrazeModule) {
      window.GrazeModule.mount(elements.canvasWrap);
    }
    
    currentMode = 'graze';
    window.currentMode = 'graze';
    
    // Update active button states
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    if (elements.grazeBtn) elements.grazeBtn.classList.add('active');
    
    return;
  }
  
  // If switching to a different mode from status, handle specially
  if (currentMode === 'status' && mode !== 'status') {
    elements.overlay.classList.remove('visible');
    if (elements.statusBtn) elements.statusBtn.textContent = 'View Status';
  }
  
  // Unmount current canvas mode if it exists and we're not coming from status
  if (currentMode !== 'status') {
    if (currentMode === 'graze' && window.GrazeModule) window.GrazeModule.unmount();
    if (currentMode === 'travel' && window.TravelGame) window.TravelGame.unmount();
    if (currentMode === 'sleep' && window.SleepModule) window.SleepModule.unmount();
  }

  currentMode = mode;
  window.currentMode = mode;

  // Button active states
  document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn-' + mode);
  if (activeBtn) activeBtn.classList.add('active');

  if (mode === 'status') {
    console.log('Showing status overlay');
    elements.overlay.classList.add('visible');
    
    // Update button text
    if (elements.statusBtn) elements.statusBtn.textContent = 'Close';
    
    // Render status data
    if (window.renderStatusOverlay) {
      window.renderStatusOverlay();
    }
    
    return;
  }

  // Reset status button text when switching to other modes
  if (elements.statusBtn) elements.statusBtn.textContent = 'View Status';

  // Hide status overlay for canvas modes
  elements.overlay.classList.remove('visible');

  // Mount canvas mode
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
};
// Mark this script as loaded
window.scriptsLoaded.uiMode = true;
window.checkAllScriptsLoaded();