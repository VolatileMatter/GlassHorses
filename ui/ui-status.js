// ui/ui-status.js
// Status overlay rendering

// ==================== STATUS OVERLAY ====================
window.renderStatusOverlay = function() {
  const overlay = document.getElementById('status-overlay');
  if (!overlay) {
    console.error('Status overlay element not found');
    return;
  }
  
  // Wait for HorseManager to be ready
  if (!window.HorseManager) {
    console.log('HorseManager not ready yet');
    overlay.innerHTML = '<span id="status-panel-title">Status</span><div style="color:#222;font-size:0.8em;padding-top:20px">Loading horse data...</div>';
    return;
  }
  
  const horses = window.HorseManager.getHorses();
  const herd = window.HorseManager.getActiveHerd();
  const herdName = herd ? herd.meta.herd_name : 'Herd';

  if (!horses || horses.length === 0) {
    overlay.innerHTML = '<span id="status-panel-title">Status</span><div style="color:#222;font-size:0.8em;padding-top:20px">No horses in this herd.</div>';
    return;
  }

  try {
    overlay.innerHTML = `<span id="status-panel-title">${herdName} — Status</span>` +
      horses.map(h => {
        const sc = window.statusColor(h);
        return `<div class="status-horse-row">
          <div class="status-swatch" style="background:${h.color || '#8B5E3C'}"></div>
          <div style="flex:1;min-width:0">
            <div class="status-name">${h.barn_name || h.name || 'Unnamed'}</div>
            <div class="status-formal">${h.formal_name || ''}</div>
          </div>
          <div class="status-meta">
            <span>${h.sex || '?'}, age ${h.age || '?'}</span>
            <span>Health ${Math.floor(h.health || 100)}%</span>
            <span>Hunger ${Math.floor(h.hunger || 75)}%</span>
          </div>
          <svg class="status-indicator" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
            <rect width="10" height="10" fill="${sc}"/>
          </svg>
        </div>`;
      }).join('');
  } catch (error) {
    console.error('Error rendering status overlay:', error);
    overlay.innerHTML = '<span id="status-panel-title">Status</span><div style="color:#e03030;font-size:0.8em;padding-top:20px">Error loading status data.</div>';
  }
};