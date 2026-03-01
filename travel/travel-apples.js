// === TRAVEL APPLES (COLLECTIBLES) ===
// Apples bob above ground like Sonic coins.
// Collected by the lead horse on contact.

const TravelApples = (() => {
  let apples       = [];
  let pendingApples = 0;

  function reset() {
    apples        = [];
    pendingApples = 0;
  }

  function getPending()  { return pendingApples; }
  function clearPending() { pendingApples = 0; }

  function update(canvasWidth, gameSpeed) {
    const TC = window.TravelConstants;
    const spawnChance = TC ? TC.APPLE_SPAWN_CHANCE : 0.003;

    apples.forEach(a => {
      a.x -= gameSpeed;
      a.bobPhase += 0.08;
    });
    apples = apples.filter(a => a.x + 18 > 0);

    if (Math.random() < spawnChance * gameSpeed) {
      _spawnCluster(canvasWidth);
    }
  }

  function _spawnCluster(canvasWidth) {
    const TC      = window.TravelConstants;
    const GROUND_Y = TC ? TC.GROUND_Y : 300;
    const count   = 2 + Math.floor(Math.random() * 3);
    const startX  = canvasWidth + 30;
    const baseY   = GROUND_Y - 55 - Math.random() * 50;
    for (let i = 0; i < count; i++) {
      apples.push({ x: startX + i * 36, y: baseY, bobPhase: Math.random() * Math.PI * 2, collected: false, collectAnim: 0 });
    }
  }

  function checkCollision(horse) {
    if (!horse || horse.dead) return 0;
    let collected = 0;
    const hx = horse.x + 12, hy = horse.y + 8, hw = 38, hh = 35;

    apples.forEach(a => {
      if (a.collected) return;
      const ax = a.x - 10;
      const ay = a.y + Math.sin(a.bobPhase) * 5 - 10;
      if (hx < ax + 24 && hx + hw > ax && hy < ay + 24 && hy + hh > ay) {
        a.collected   = true;
        a.collectAnim = 1;
        collected++;
        pendingApples++;
      }
    });
    return collected;
  }

  function draw(ctx) {
    apples.forEach(a => {
      if (a.collectAnim > 0) {
        _drawCollectEffect(ctx, a);
        a.collectAnim -= 0.07;
        return;
      }
      if (a.collected) return;
      _drawApple(ctx, a.x, a.y + Math.sin(a.bobPhase) * 5);
    });
  }

  function _drawApple(ctx, x, y) {
    // Glow
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 14);
    glow.addColorStop(0, 'rgba(255,80,60,0.35)');
    glow.addColorStop(1, 'rgba(255,80,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();

    // Body
    ctx.fillStyle = '#e03030';
    ctx.beginPath(); ctx.arc(x, y + 1, 9, 0, Math.PI * 2); ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(x - 2, y - 2, 4, 3, -0.5, 0, Math.PI * 2); ctx.fill();

    // Stem
    ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.bezierCurveTo(x+2, y-14, x+5, y-15, x+4, y-13); ctx.stroke();

    // Leaf
    ctx.fillStyle = '#2a9a20';
    ctx.beginPath(); ctx.ellipse(x + 4, y - 13, 4, 2, 0.8, 0, Math.PI * 2); ctx.fill();
  }

  function _drawCollectEffect(ctx, a) {
    const alpha = a.collectAnim;
    const scale = 1 + (1 - a.collectAnim) * 1.4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(a.x, a.y);
    ctx.scale(scale, scale);
    _drawApple(ctx, 0, 0);
    ctx.strokeStyle = `rgba(255,220,50,${alpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r1 = 12 + (1 - alpha) * 14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
      ctx.lineTo(Math.cos(angle) * (r1 + 6), Math.sin(angle) * (r1 + 6));
      ctx.stroke();
    }
    ctx.restore();
  }

  return { reset, update, draw, checkCollision, getPending, clearPending };
})();

window.TravelApples = TravelApples;
console.log('✅ travel-apples.js loaded');