// ui/ui-herds.js
// Herd tab management

// ==================== HERD TABS ====================
window.refreshHerdTabs = function() {
  const bar = document.getElementById('herd-tabs');
  if (!bar || !window.HorseManager) return;
  const herds = window.HorseManager.getAllHerds();
  const activeId = window.HorseManager.getActiveHerdId();
  bar.innerHTML = herds.map(({ meta, horses }) =>
    `<button class="herd-tab${meta.herd_id === activeId ? ' active' : ''}"
             onclick="window.selectHerd('${meta.herd_id}')">
      ${meta.herd_name}
      <span class="herd-count">${horses.length}</span>
    </button>`
  ).join('');
  // Show new-herd tab if debug or authorized
  const newTab = document.getElementById('new-herd-tab');
  if (newTab) newTab.style.display = (window.isDebugActive?.() || window.GlassHorsesDrive) ? 'flex' : 'none';
};

window.selectHerd = function(herdId) {
  if (!window.HorseManager) return;
  window.HorseManager.setActiveHerd(herdId);
  window.refreshHerdTabs();
  window.refreshDebugHerdSwitcher?.();
  window.renderDebugRoster?.();
  if (window.currentMode === 'status') window.renderStatusOverlay?.();
  else if (window.currentMode) window.switchMode?.(window.currentMode);
};

window.onHerdChange = function() {
  window.refreshHerdTabs();
  window.refreshDebugHerdSwitcher?.();
  window.renderDebugRoster?.();
  if (window.currentMode === 'status') window.renderStatusOverlay?.();
};