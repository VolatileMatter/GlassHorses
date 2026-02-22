// === TRAVEL APPLES (COLLECTIBLES) ===
// Apples float above ground like coins in Sonic.
// They are collected by the lead horse on contact.

const TravelApples = (() => {
  const C = () => window.TravelConstants;

  let apples = [];
  let floatOffset = 0; // global sine wave for bob animation
  let pendingApples = 0; // apples waiting to be cashed in at checkpoint

  function reset() {
    apples = [];
    floatOffset = 0;
    pendingApples = 0;
  }

  function getPending() { return pendingApples; }
  function clearPending() { pendingApples = 0; }

  // Called each frame — chance to spawn a cluster of apples
  function update(canvasWidth, gameSpeed) {
    floatOffset += 0.07;

    // Move existing apples left
    apples.forEach(a => {
      a.x -= gameSpeed;
      a.bobPhase += 0.08;
    });

    // Remove off-screen
    apples = apples.filter(a => a.x + 18 > 0);

    // Spawn clusters
    if (Math.random() < C().APPLE_SPAWN_CHANCE * gameSpeed) {
      spawnCluster(canvasWidth);
    }
  }

  function spawnCluster(canvasWidth) {
    const GROUND_Y = C().GROUND_Y;
    // 2–4 apples in an arc
    const count = 2 + Math.floor(Math.random() * 3);
    const startX = canvasWidth + 30;
    const baseY = GROUND_Y - 55 - Math.random() * 50;
    for (let i = 0; i < count; i++) {
      apples.push({
        x: startX + i * 36,
        y: baseY,
        bobPhase: Math.random() * Math.PI * 2,
        collected: false,
        collectAnim: 0,
      });
    }
  }

  // Manually spawn a cluster at a fixed x (for checkpoints etc.)
  function spawnAt(x, count = 3) {
    const GROUND_Y = C().GROUND_Y;
    const baseY = GROUND_Y - 60 - Math.random() * 30;
    for (let i = 0; i < count; i++) {
      apples.push({
        x: x + i * 34,
        y: baseY,
        bobPhase: i * 0.5,
        collected: false,
        collectAnim: 0,
      });
    }
  }

  // Returns true if any apple was collected; increments pending count
  function checkCollision(leadHorse) {
    if (!leadHorse || leadHorse.dead) return 0;
    let collected = 0;

    const hx = leadHorse.x + 8;
    const hy = leadHorse.y + 5;
    const hw = 44;
    const hh = 42;

    apples.forEach(a => {
      if (a.collected) return;
      const ax = a.x - 12;
      const ay = a.y + Math.sin(a.bobPhase) * 5 - 12;
      if (hx < ax + 24 && hx + hw > ax && hy < ay + 24 && hy + hh > ay) {
        a.collected = true;
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
        a.collectAnim -= 0.08;
        return;
      }
      if (a.collected) return;
      const bob = Math.sin(a.bobPhase) * 5;
      _drawApple(ctx, a.x, a.y + bob);
    });
  }

  function _drawApple(ctx, x, y) {
    // Glow ring
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 14);
    glow.addColorStop(0, 'rgba(255, 80, 60, 0.3)');
    glow.addColorStop(1, 'rgba(255, 80, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Apple body
    ctx.fillStyle = '#e83030';
    ctx.beginPath();
    ctx.arc(x, y + 1, 9, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(x - 2, y - 2, 4, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#4a2a10';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.bezierCurveTo(x + 2, y - 14, x + 5, y - 15, x + 4, y - 13);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = '#2a9a20';
    ctx.beginPath();
    ctx.ellipse(x + 4, y - 13, 4, 2, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function _drawCollectEffect(ctx, a) {
    const alpha = a.collectAnim;
    const scale = 1 + (1 - a.collectAnim) * 1.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(a.x, a.y);
    ctx.scale(scale, scale);
    _drawApple(ctx, 0, 0);
    // Star burst
    ctx.strokeStyle = `rgba(255, 220, 50, ${alpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r1 = 10 + (1 - alpha) * 14;
      const r2 = r1 + 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
      ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  return { reset, update, draw, checkCollision, getPending, clearPending, spawnAt };
})();

window.TravelApples = TravelApples;
console.log('✅ travel-apples.js loaded');