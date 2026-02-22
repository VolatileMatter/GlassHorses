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
  
  // Show new-herd tab if debug or authorized
  const newTab = document.getElementById('new-herd-tab');
  if (newTab) {
    newTab.style.display = (window.isDebugActive?.() || window.GlassHorsesDrive) ? 'flex' : 'none';
  }
};

window.selectHerd = function(herdId) {
  if (!window.HorseManager) return;
  window.HorseManager.setActiveHerd(herdId);
  window.refreshHerdTabs();
  if (window.refreshDebugHerdSwitcher) window.refreshDebugHerdSwitcher();
  if (window.renderDebugRoster) window.renderDebugRoster();
  
  // If in status mode, refresh the status display
  if (window.currentMode === 'status' && window.renderStatusOverlay) {
    window.renderStatusOverlay();
  }
};

window.onHerdChange = function() {
  // Only refresh if DOM is ready
  if (document.getElementById('herd-tabs')) {
    window.refreshHerdTabs();
    if (window.refreshDebugHerdSwitcher) window.refreshDebugHerdSwitcher();
    if (window.renderDebugRoster) window.renderDebugRoster();
    
    // If in status mode, refresh the status display
    if (window.currentMode === 'status' && window.renderStatusOverlay) {
      window.renderStatusOverlay();
    }
  }
};

// Mark this script as loaded
window.scriptsLoaded.uiHerds = true;
window.checkAllScriptsLoaded();