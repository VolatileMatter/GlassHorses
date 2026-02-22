// ui/ui-mode.js
// Mode switching logic

// ==================== MODE MANAGEMENT ====================
let currentMode = null;
window.currentMode = null;

window.switchMode = function(mode) {
  console.log('Switching to mode:', mode, 'current:', currentMode);
  
  // If clicking status while already in status mode, close it
  if (mode === 'status' && currentMode === 'status') {
    console.log('Closing status overlay');
    
    // Hide status overlay
    document.getElementById('status-overlay').classList.remove('visible');
    
    // Update button text
    const statusBtn = document.getElementById('btn-status');
    if (statusBtn) statusBtn.textContent = 'View Status';
    
    // Reactivate graze mode
    if (window.GrazeModule) {
      window.GrazeModule.mount(document.getElementById('canvas-wrap'));
    }
    
    currentMode = 'graze';
    window.currentMode = 'graze';
    
    // Update active button states
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-graze')?.classList.add('active');
    
    return;
  }
  
  // If switching to a different mode from status, handle specially
  if (currentMode === 'status' && mode !== 'status') {
    // Just hide the overlay, no need to unmount anything else
    document.getElementById('status-overlay').classList.remove('visible');
    
    // Update status button text
    const statusBtn = document.getElementById('btn-status');
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

  const canvasWrap = document.getElementById('canvas-wrap');
  const overlay = document.getElementById('status-overlay');

  if (mode === 'status') {
    console.log('Showing status overlay');
    overlay.classList.add('visible');
    
    // Update button text
    const statusBtn = document.getElementById('btn-status');
    if (statusBtn) statusBtn.textContent = 'Close';
    
    // Render status data
    if (window.renderStatusOverlay) window.renderStatusOverlay();
    
    return;
  }

  // Reset status button text when switching to other modes
  const statusBtn = document.getElementById('btn-status');
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