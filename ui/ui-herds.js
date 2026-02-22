// ui/ui-herds.js
// Herd tab management

// ==================== HERD TABS ====================
window.refreshHerdTabs = function() {
  const bar = document.getElementById('herd-tabs');
  if (!bar || !window.HorseManager) {
    console.log('Herd tabs not ready yet');
    return;
  }
  
  const herds = window.HorseManager.getAllHerds();
  const activeId = window.HorseManager.getActiveHerdId();
  
  if (!herds || herds.length === 0) {
    bar.innerHTML = '<button class="herd-tab">No herds</button>';
    return;
  }
  
  bar.innerHTML = herds.map(({ meta, horses }) =>
    `<button class="herd-tab${meta.herd_id === activeId ? ' active' : ''}"
             onclick="window.selectHerd('${meta.herd_id}')">
      ${meta.herd_name}
      <span class="herd-count">${horses ? horses.length : 0}</span>
    </button>`
  ).join('');
  
  // Show new-herd tab if authorized
  const newTab = document.getElementById('new-herd-tab');
  if (newTab) {
    newTab.style.display = window.GlassHorsesDrive ? 'inline-block' : 'inline-block'; // Always show for now
  }
};

window.selectHerd = function(herdId) {
  console.log('Selecting herd:', herdId);
  
  if (!window.HorseManager) {
    console.error('HorseManager not available');
    return;
  }
  
  // Set active herd
  window.HorseManager.setActiveHerd(herdId);
  
  // Refresh all UI components
  refreshAllUI();
};

// Central function to refresh all UI after herd change
function refreshAllUI() {
  console.log('Refreshing all UI after herd change');
  
  // Update tabs
  window.refreshHerdTabs();
  
  // Get current mode and refresh the display
  const currentMode = window.currentMode || 'graze';
  
  // Re-mount the current mode to refresh with new herd data
  const canvasWrap = document.getElementById('canvas-wrap');
  if (!canvasWrap) return;
  
  // Unmount current module
  if (currentMode === 'graze' && window.GrazeModule) {
    window.GrazeModule.unmount();
    setTimeout(() => window.GrazeModule.mount(canvasWrap), 10);
  }
  else if (currentMode === 'status' && window.StatusModule) {
    window.StatusModule.unmount();
    setTimeout(() => window.StatusModule.mount(canvasWrap), 10);
  }
  else if (currentMode === 'travel' && window.TravelGame) {
    window.TravelGame.unmount();
    setTimeout(() => window.TravelGame.mount(canvasWrap), 10);
  }
  else if (currentMode === 'sleep' && window.SleepModule) {
    window.SleepModule.unmount();
    setTimeout(() => window.SleepModule.mount(canvasWrap), 10);
  }
  
  // Also update status overlay if visible
  const overlay = document.getElementById('status-overlay');
  if (overlay && overlay.style.display === 'block' && window.renderStatusOverlay) {
    window.renderStatusOverlay();
  }
}

window.onHerdChange = function(herds, activeHerdId) {
  console.log('Herd change detected, active herd:', activeHerdId);
  
  // Only refresh if DOM is ready
  if (document.getElementById('herd-tabs')) {
    refreshAllUI();
  }
};

// Add keyboard shortcut for debugging (optional - can remove)
window.debugHerds = function() {
  console.log('Current herds:', window.HorseManager?.getAllHerds());
  console.log('Active herd:', window.HorseManager?.getActiveHerd());
};

// Mark this script as loaded
window.scriptsLoaded.uiHerds = true;
window.checkAllScriptsLoaded();