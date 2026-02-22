// status.js
// Status module - displays herd information as a canvas-rendered view
// Now also shows herd inventory (apples, future items)

window.StatusModule = (function() {
  let canvas = null;
  let ctx = null;
  let animationFrame = null;
  let mounted = false;
  
  function mount(container) {
    if (!container) return;
    container.innerHTML = '';
    
    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 400;
    canvas.style.cssText = `
      width: 100%; height: 100%; display: block;
      background: rgba(10, 10, 18, 0.97);
      border-radius: 12px;
      border: 2px solid rgba(0, 255, 255, 0.3);
      box-shadow: inset 0 0 30px rgba(138, 43, 226, 0.2);
    `;
    
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');
    mounted = true;

    window.addEventListener('resize', handleResize);
    render();
  }
  
  function unmount() {
    if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
    window.removeEventListener('resize', handleResize);
    if (canvas && canvas.parentNode) canvas.parentNode.innerHTML = '';
    canvas = null; ctx = null; mounted = false;
  }
  
  function handleResize() {
    if (!mounted || !canvas || !canvas.parentNode) return;
    const c = canvas.parentNode;
    canvas.width = c.clientWidth || 800;
    canvas.height = c.clientHeight || 400;
    render();
  }
  
  function render() {
    if (!mounted || !ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const horses     = window.HorseManager ? window.HorseManager.getHorses()    : [];
    const activeHerd = window.HorseManager ? window.HorseManager.getActiveHerd() : null;
    const herdName   = activeHerd ? activeHerd.meta.herd_name : 'No Herd';
    const inventory  = (activeHerd && activeHerd.meta.inventory) ? activeHerd.meta.inventory : {};

    const w = canvas.width;

    // Title
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fillText(`${herdName} — Status`, 28, 44);
    ctx.shadowBlur = 0;

    // --- INVENTORY PANEL (top right) ---
    _drawInventory(ctx, w, inventory);

    // Divider
    ctx.strokeStyle = 'rgba(255,0,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, 58); ctx.lineTo(w - 28, 58); ctx.stroke();

    // Horse count
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff88ff';
    ctx.fillText(`${horses.length} horse${horses.length !== 1 ? 's' : ''}`, 28, 78);

    if (!horses || horses.length === 0) {
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText('No horses in this herd.', 28, 140);
      return;
    }

    // --- HORSE GRID ---
    const startY = 92;
    const rowH   = 72;
    const cols   = 2;
    const colW   = (w - 56) / cols;

    horses.forEach((horse, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 28 + col * colW;
      const y = startY + row * rowH;
      if (y + rowH > canvas.height - 10) return;
      _drawHorseRow(ctx, horse, x, y, colW - 12);
    });

    // Footer
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'center';
    ctx.fillText('Click Status again to return', w / 2, canvas.height - 10);
    ctx.textAlign = 'left';
  }

  function _drawInventory(ctx, canvasWidth, inventory) {
    // Inventory box — top right corner
    const items = [
      { key: 'apples', label: 'Apples', icon: '🍎', color: '#ff6666' },
      // Future items added here:
      // { key: 'carrots', label: 'Carrots', icon: '🥕', color: '#ff9933' },
      // { key: 'hay',    label: 'Hay',     icon: '🌾', color: '#d4a820' },
    ];

    const bx = canvasWidth - 200;
    const by = 14;
    const bw = 172;
    const lineH = 20;
    const bh = 14 + items.length * lineH + 4;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    _roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,220,50,0.35)';
    ctx.lineWidth = 1;
    _roundRect(ctx, bx, by, bw, bh, 6);
    ctx.stroke();

    ctx.fillStyle = '#ffe840';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('🎒 HERD INVENTORY', bx + 8, by + 12);

    items.forEach((item, i) => {
      const val = inventory[item.key] || 0;
      const iy = by + 14 + i * lineH;
      ctx.fillStyle = item.color;
      ctx.font = '13px monospace';
      ctx.fillText(`${item.icon} ${item.label}`, bx + 8, iy + 13);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`×${val}`, bx + bw - 8, iy + 13);
      ctx.textAlign = 'left';
    });
  }

  function _drawHorseRow(ctx, horse, x, y, w) {
    const sc = window.statusColor ? window.statusColor(horse) : '#2ecc71';

    // BG
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    _roundRect(ctx, x, y, w, 62, 6);
    ctx.fill();

    // Color orb
    ctx.fillStyle = horse.color || '#8B5E3C';
    ctx.shadowColor = horse.color || '#8B5E3C';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x + 22, y + 22, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Exhausted indicator
    const exhausted = horse.travelExhausted;
    if (exhausted) {
      ctx.fillStyle = 'rgba(255,80,80,0.18)';
      _roundRect(ctx, x, y, w, 62, 6);
      ctx.fill();
    }

    // Name
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = exhausted ? '#ff8888' : '#ffffff';
    ctx.fillText(_truncate(horse.barn_name || horse.name || 'Unnamed', 18), x + 44, y + 18);

    // Formal name
    ctx.font = 'italic 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(_truncate(horse.formal_name || '', 28), x + 44, y + 32);

    // Exhaustion label
    if (exhausted) {
      ctx.fillStyle = '#ff8888';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('⚡ Exhausted — needs food+sleep', x + 44, y + 47);
    } else {
      // Stats
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#00ffff';
      const health = Math.floor(horse.health || 100);
      const hunger = Math.floor(horse.hunger || 75);
      ctx.fillText(`♥ ${health}%  🌾 ${hunger}%  ${horse.sex || '?'} age ${horse.age || '?'}`, x + 44, y + 47);
    }

    // Status dot
    ctx.fillStyle = sc;
    ctx.beginPath();
    ctx.arc(x + w - 10, y + 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function _truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  return { mount, unmount };
})();

if (typeof window.scriptsLoaded !== 'undefined') {
  window.scriptsLoaded.status = true;
  if (window.checkAllScriptsLoaded) window.checkAllScriptsLoaded();
}