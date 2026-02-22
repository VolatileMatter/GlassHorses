// ui/ui-debug.js
// Debug mode UI

// ==================== DEBUG MODE ====================
let _debugActive = true; // Set to true by default since we're using debug data

window.isDebugActive = () => _debugActive;

window.toggleDebugMode = function() {
  _debugActive = !_debugActive;
  const btn = document.getElementById('debug-toggle-btn');
  btn.textContent = _debugActive ? 'Debug ON' : 'Debug';
  btn.classList.toggle('active', _debugActive);
  document.getElementById('debug-banner').classList.toggle('visible', _debugActive);
  document.getElementById('debug-roster').classList.toggle('visible', _debugActive);

  if (_debugActive && window.HorseManager) {
    window.HorseManager.loadDebugHerds();
    window.HorseManager.onChange(window.onHerdChange);
  } else if (window.HorseManager) {
    window.HorseManager.loadFromSave([]);
  }
  
  window.refreshHerdTabs?.();
  window.refreshDebugHerdSwitcher?.();
  window.renderDebugRoster?.();
  
  if (window.currentMode === 'status') {
    window.renderStatusOverlay?.();
  }
};

// ==================== DEBUG ROSTER ====================
window.refreshDebugHerdSwitcher = function() {
  const sw = document.getElementById('debug-herd-switcher');
  if (!sw || !window.HorseManager) return;
  
  const herds = window.HorseManager.getAllHerds();
  const activeId = window.HorseManager.getActiveHerdId();
  
  if (!herds || herds.length === 0) {
    sw.innerHTML = '';
    return;
  }
  
  sw.innerHTML = herds.map(({ meta }) =>
    `<button class="debug-herd-pill${meta.herd_id === activeId ? ' active' : ''}"
             onclick="window.selectHerd('${meta.herd_id}')">
      ${meta.herd_name}
    </button>`
  ).join('');
};

window.renderDebugRoster = function() {
  const grid = document.getElementById('debug-horse-grid');
  if (!grid || !window.HorseManager) return;
  
  const horses = window.HorseManager.getHorses();
  const activeHerd = window.HorseManager.getActiveHerd();

  if (!activeHerd) {
    grid.innerHTML = '<div class="empty-herd-msg">No active herd.</div>';
    return;
  }

  if (!horses || horses.length === 0) {
    grid.innerHTML = '<div class="empty-herd-msg">No horses in this herd.</div>';
    return;
  }

  try {
    grid.innerHTML = horses.map(horse => {
      const sc = window.statusColor(horse);
      return `<div class="debug-horse-card">
        <div class="dh-top">
          <div class="dh-swatch" style="background:${horse.color || '#8B5E3C'}"></div>
          <div class="dh-name">${horse.barn_name || 'Unnamed'}</div>
          <div class="dh-sex">${horse.sex || '?'}</div>
          <svg class="dh-status-sq" viewBox="0 0 7 7" xmlns="http://www.w3.org/2000/svg"><rect width="7" height="7" fill="${sc}"/></svg>
        </div>
        <div class="dh-formal">${horse.formal_name || ''}</div>
        <div class="dh-row"><span>Age</span><span>${horse.age || '?'} yrs</span></div>
        <div class="dh-row"><span>Birthday</span><span>${horse.birthday || '?'}</span></div>
        <div class="dh-row"><span>Herd</span><span>${horse.current_herd || '?'}</span></div>
        <div class="dh-row"><span>Born in</span><span>${horse.birth_herd || '?'}</span></div>
        <div class="dh-section">
          <div class="dh-section-label">Personality</div>
          <div class="dh-traits">${horse.personality?.temperament || '?'} — ${horse.personality?.traits?.join(', ') || '?'}</div>
          <div style="color:#222;font-style:italic;font-size:0.9em">${horse.personality?.notes || ''}</div>
        </div>
        <div class="dh-section">
          <div class="dh-section-label">Genetics</div>
          <div class="dh-row"><span>Coat</span><span>${horse.genetics?.coat || '?'}</span></div>
          <div class="dh-row"><span>Markings</span><span>${horse.genetics?.markings || '?'}</span></div>
          <div class="dh-row"><span>Build</span><span>${horse.genetics?.build || '?'}</span></div>
          <div class="dh-genes">dom: ${horse.genetics?.dominant_genes?.join(', ') || '?'}<br>rec: ${horse.genetics?.recessive_genes?.join(', ') || '?'}</div>
        </div>
        <div class="dh-section">
          <div class="dh-section-label">Abilities</div>
          ${horse.abilities?.map(a => `
            <div class="dh-ability">${a.name}<span class="dh-ability-scope">[${a.active_in?.join(', ') || '?'}]</span></div>
            <div class="dh-ability-desc">${a.description || ''}</div>
          `).join('') || 'None'}
        </div>
      </div>`;
    }).join('');
  } catch (error) {
    console.error('Error rendering debug roster:', error);
    grid.innerHTML = '<div class="empty-herd-msg">Error rendering horse data.</div>';
  }
};

// Mark this script as loaded
window.scriptsLoaded.uiDebug = true;
window.checkAllScriptsLoaded();