// ui/ui-debug.js
// Debug mode UI

// ==================== DEBUG MODE ====================
let _debugActive = false;

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
  if (window.currentMode) window.switchMode?.(window.currentMode);
};

// ==================== DEBUG ROSTER ====================
window.refreshDebugHerdSwitcher = function() {
  const sw = document.getElementById('debug-herd-switcher');
  if (!sw || !window.HorseManager) return;
  const herds = window.HorseManager.getAllHerds();
  const activeId = window.HorseManager.getActiveHerdId();
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

  if (horses.length === 0) {
    grid.innerHTML = '<div class="empty-herd-msg">No horses in this herd.</div>';
    return;
  }
  grid.innerHTML = horses.map(h => {
    const sc = window.statusColor(h);
    return `<div class="debug-horse-card">
      <div class="dh-top">
        <div class="dh-swatch" style="background:${h.color}"></div>
        <div class="dh-name">${h.barn_name}</div>
        <div class="dh-sex">${h.sex}</div>
        <svg class="dh-status-sq" viewBox="0 0 7 7" xmlns="http://www.w3.org/2000/svg"><rect width="7" height="7" fill="${sc}"/></svg>
      </div>
      <div class="dh-formal">${h.formal_name}</div>
      <div class="dh-row"><span>Age</span><span>${h.age} yrs</span></div>
      <div class="dh-row"><span>Birthday</span><span>${h.birthday}</span></div>
      <div class="dh-row"><span>Herd</span><span>${h.current_herd}</span></div>
      <div class="dh-row"><span>Born in</span><span>${h.birth_herd}</span></div>
      <div class="dh-section">
        <div class="dh-section-label">Personality</div>
        <div class="dh-traits">${h.personality.temperament} — ${h.personality.traits.join(', ')}</div>
        <div style="color:#222;font-style:italic;font-size:0.9em">${h.personality.notes}</div>
      </div>
      <div class="dh-section">
        <div class="dh-section-label">Genetics</div>
        <div class="dh-row"><span>Coat</span><span>${h.genetics.coat}</span></div>
        <div class="dh-row"><span>Markings</span><span>${h.genetics.markings}</span></div>
        <div class="dh-row"><span>Build</span><span>${h.genetics.build}</span></div>
        <div class="dh-genes">dom: ${h.genetics.dominant_genes.join(', ')}<br>rec: ${h.genetics.recessive_genes.join(', ')}</div>
      </div>
      <div class="dh-section">
        <div class="dh-section-label">Abilities</div>
        ${h.abilities.map(a => `
          <div class="dh-ability">${a.name}<span class="dh-ability-scope">[${a.active_in.join(', ')}]</span></div>
          <div class="dh-ability-desc">${a.description}</div>
        `).join('')}
      </div>
    </div>`;
  }).join('');
};