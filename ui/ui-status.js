// ui/ui-status.js
// Status overlay rendering - COMPLETELY FIXED with error handling and fallbacks

// ==================== STATUS OVERLAY ====================
window.renderStatusOverlay = function() {
  console.log('Rendering status overlay...');
  
  const overlay = document.getElementById('status-overlay');
  if (!overlay) {
    console.error('❌ Status overlay element not found - attempting to create it');
    
    // Try to create the overlay if it doesn't exist
    const canvasWrap = document.getElementById('canvas-wrap');
    if (canvasWrap) {
      const newOverlay = document.createElement('div');
      newOverlay.id = 'status-overlay';
      newOverlay.style.cssText = 'display:block;position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(20,20,30,0.95);backdrop-filter:blur(8px);color:#e0e0e0;z-index:1000;overflow-y:auto;padding:20px;border-radius:12px;border:2px solid rgba(0,255,255,0.3);';
      canvasWrap.appendChild(newOverlay);
      console.log('✅ Status overlay created dynamically');
      
      // Recursively call this function now that overlay exists
      setTimeout(() => window.renderStatusOverlay(), 50);
      return;
    } else {
      console.error('❌ Cannot create overlay - canvas-wrap not found');
      return;
    }
  }
  
  // Make sure overlay is visible
  overlay.style.display = 'block';
  
  // Wait for HorseManager to be ready
  if (!window.HorseManager) {
    console.log('HorseManager not ready yet');
    overlay.innerHTML = `
      <div style="font-size:1.2em; font-weight:bold; color:#00ffff; margin-bottom:15px; padding-bottom:5px; border-bottom:2px solid rgba(255,0,255,0.3);">
        Status Panel
      </div>
      <div style="color:#aaa; text-align:center; padding:20px;">
        ⏳ Loading horse data...
      </div>
    `;
    return;
  }
  
  const activeHerd = window.HorseManager.getActiveHerd();
  const horses = window.HorseManager.getHorses();
  
  if (!activeHerd) {
    overlay.innerHTML = `
      <div style="font-size:1.2em; font-weight:bold; color:#00ffff; margin-bottom:15px; padding-bottom:5px; border-bottom:2px solid rgba(255,0,255,0.3);">
        Status Panel
      </div>
      <div style="color:#d4a017; text-align:center; padding:20px;">
        ⚠️ No active herd selected.
      </div>
    `;
    return;
  }
  
  const herdName = activeHerd.meta.herd_name || 'Herd';

  if (!horses || horses.length === 0) {
    overlay.innerHTML = `
      <div style="font-size:1.2em; font-weight:bold; color:#00ffff; margin-bottom:15px; padding-bottom:5px; border-bottom:2px solid rgba(255,0,255,0.3);">
        ${herdName} — Status
      </div>
      <div style="color:#aaa; text-align:center; padding:20px;">
        🐎 No horses in this herd.
      </div>
    `;
    return;
  }

  try {
    overlay.innerHTML = `
      <div style="font-size:1.2em; font-weight:bold; color:#00ffff; margin-bottom:15px; padding-bottom:5px; border-bottom:2px solid rgba(255,0,255,0.3);">
        ${herdName} — Status (${horses.length} horses)
      </div>
      ${horses.map(horse => {
        const sc = window.statusColor(horse);
        return `<div style="display: flex; align-items: center; gap: 12px; padding: 10px; margin: 5px 0; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="width: 30px; height: 30px; border-radius: 50%; background: ${horse.color || '#8B5E3C'}; border: 2px solid rgba(255, 255, 255, 0.3); flex-shrink: 0;"></div>
          <div style="flex:1; min-width:0">
            <div style="font-weight: bold; color: #fff;">${horse.barn_name || horse.name || 'Unnamed'}</div>
            <div style="font-size: 0.8em; color: #aaa; font-style: italic;">${horse.formal_name || ''}</div>
          </div>
          <div style="display: flex; flex-direction: column; font-size: 0.8em; color: #00ffff; margin-left: auto; flex-shrink: 0;">
            <span>${horse.sex || '?'}, age ${horse.age || '?'}</span>
            <span>Health ${Math.floor(horse.health || 100)}%</span>
            <span>Hunger ${Math.floor(horse.hunger || 75)}%</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 10 10" style="flex-shrink: 0;">
            <rect width="10" height="10" fill="${sc}"/>
          </svg>
        </div>`;
      }).join('')}
      <div style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #666;">
        Click Status again to close
      </div>
    `;
    console.log('✅ Status overlay rendered successfully');
  } catch (error) {
    console.error('Error rendering status overlay:', error);
    overlay.innerHTML = `
      <div style="font-size:1.2em; font-weight:bold; color:#00ffff; margin-bottom:15px; padding-bottom:5px; border-bottom:2px solid rgba(255,0,255,0.3);">
        Status Panel
      </div>
      <div style="color:#e03030; text-align:center; padding:20px;">
        ❌ Error loading status data.<br>
        <small>${error.message}</small>
      </div>
    `;
  }
};

// Add a helper function to manually test the status overlay
window.testStatusOverlay = function() {
  console.log('Testing status overlay...');
  const overlay = document.getElementById('status-overlay');
  if (overlay) {
    overlay.style.display = 'block';
    overlay.innerHTML = `
      <div style="font-size:1.2em; font-weight:bold; color:#00ffff; margin-bottom:15px; padding-bottom:5px; border-bottom:2px solid rgba(255,0,255,0.3);">
        Test Mode
      </div>
      <div style="color:#aaa; text-align:center; padding:20px;">
        ✅ Status overlay is working!<br>
        <small>Click Status button again to close</small>
      </div>
    `;
    console.log('✅ Test overlay shown');
  } else {
    console.error('❌ Status overlay not found');
  }
};

// Mark this script as loaded
if (typeof window.scriptsLoaded !== 'undefined') {
  window.scriptsLoaded.uiStatus = true;
  if (window.checkAllScriptsLoaded) window.checkAllScriptsLoaded();
}