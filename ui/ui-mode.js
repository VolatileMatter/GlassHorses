// ui/ui-mode.js
// Mode switching logic

// ==================== MODE MANAGEMENT ====================
let currentMode = null;
window.currentMode = null;

window.switchMode = function(mode) {
  console.log('Switching to mode:', mode, 'current:', currentMode);
  
  // Get DOM elements safely
  const overlay = document.getElementById('status-overlay');
  const canvasWrap = document.getElementById('canvas-wrap');
  const statusBtn = document.getElementById('btn-status');
  const grazeBtn = document.getElementById('btn-graze');
  
  if (!overlay || !canvasWrap) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // If clicking status while already in status mode, close it
  if (mode === 'status' && currentMode === 'status') {
    console.log('Closing status overlay');
    
    // Hide status overlay
    overlay.classList.remove('visible');
    
    // Update button text
    if (statusBtn) statusBtn.textContent = 'View Status';
    
    // Reactivate graze mode
    if (window.GrazeModule) {
      window.GrazeModule.mount(canvasWrap);
    }
    
    currentMode = 'graze';
    window.currentMode = 'graze';
    
    // Update active button states
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    if (grazeBtn) grazeBtn.classList.add('active');
    
    return;
  }
  
  // If switching to a different mode from status, handle specially
  if (currentMode === 'status' && mode !== 'status') {
    // Just hide the overlay, no need to unmount anything else
    overlay.classList.remove('visible');
    
    // Update status button text
    if (statusBtn) statusBtn.textContent = 'View Status';
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
    overlay.classList.add('visible');
    
    // Update button text
    if (statusBtn) statusBtn.textContent = 'Close';
    
    // Render status data
    if (window.renderStatusOverlay) {
      setTimeout(() => window.renderStatusOverlay(), 50); // Small delay to ensure DOM is ready
    }
    
    return;
  }

  // Reset status button text when switching to other modes
  if (statusBtn) statusBtn.textContent = 'View Status';

  // Hide status overlay for canvas modes
  overlay.classList.remove('visible');

  // Mount canvas mode
  if (mode === 'graze' && window.GrazeModule) {
    console.log('Mounting graze mode');
    window.GrazeModule.mount(canvasWrap);
  }
  if (mode === 'travel' && window.TravelGame) {
    console.log('Mounting travel mode');
    window.TravelGame.mount(canvasWrap);
  }
  if (mode === 'sleep' && window.SleepModule) {
    console.log('Mounting sleep mode');
    window.SleepModule.mount(canvasWrap);
  }
};