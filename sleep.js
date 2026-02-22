// === SLEEP MODE ===
// Horses heal injuries, age up, and tick over statuses.
// Horses cannot breed while sleeping.

const SleepModule = (() => {
  let canvas, ctx, animId, container;
  let frameCount = 0;
  let stars = [];
  let lastTickTime = null;
  const TICK_INTERVAL_MS = 10000; // 10 seconds = 1 sleep tick

  // Soft firefly particles
  let fireflies = [];

  function initScene() {
    // Stars
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.55,
        r: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
      });
    }
    // Fireflies
    fireflies = [];
    for (let i = 0; i < 18; i++) {
      fireflies.push({
        x: 60 + Math.random() * (canvas.width - 120),
        y: canvas.height * 0.5 + Math.random() * 120,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.05 + Math.random() * 0.08,
      });
    }
    lastTickTime = Date.now();
  }

  function updateFireflies() {
    fireflies.forEach(f => {
      f.phase += f.speed;
      f.x += f.vx + Math.sin(f.phase * 0.7) * 0.3;
      f.y += f.vy + Math.cos(f.phase * 0.5) * 0.2;
      if (f.x < 30) { f.x = 30; f.vx = Math.abs(f.vx); }
      if (f.x > canvas.width - 30) { f.x = canvas.width - 30; f.vx = -Math.abs(f.vx); }
      if (f.y < canvas.height * 0.48) { f.y = canvas.height * 0.48; f.vy = Math.abs(f.vy); }
      if (f.y > canvas.height - 20) { f.y = canvas.height - 20; f.vy = -Math.abs(f.vy); }
    });
  }

  // ---- Sleep Tick (healing, aging, statuses) ----
  function sleepTick(horses) {
    horses.forEach(horse => {
      // Heal injuries
      if (horse.injured) {
        horse.health = Math.min(100, (horse.health || 100) + 5);
        if (horse.health >= 100) {
          horse.injured = false;
          console.log(`🩹 ${horse.name} has recovered from injury!`);
        }
      } else {
        horse.health = Math.min(100, (horse.health || 100) + 2);
      }

      // Age tick (each real sleep session ages by a small amount)
      // Full aging tracked in Supabase; here we increment a soft counter
      horse.sleepTicks = (horse.sleepTicks || 0) + 1;

      // Hunger decays slowly even while sleeping
      horse.hunger = Math.max(0, (horse.hunger || 50) - 2);

      // Mood recovers during sleep
      if (horse.health >= 80 && horse.hunger >= 30) horse.mood = 'content';
    });
  }

  // ---- Draw ----
  function drawNightBackground() {
    const w = canvas.width, h = canvas.height;

    // Night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#050818');
    sky.addColorStop(0.6, '#0d1b40');
    sky.addColorStop(1, '#1a2a55');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.6);

    // Ground (dark grass)
    const ground = ctx.createLinearGradient(0, h * 0.58, 0, h);
    ground.addColorStop(0, '#0d2010');
    ground.addColorStop(1, '#060e08');
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.58, w, h);

    // Horizon glow (moonrise)
    const hglow = ctx.createRadialGradient(w * 0.8, h * 0.58, 0, w * 0.8, h * 0.58, 200);
    hglow.addColorStop(0, 'rgba(180,160,100,0.15)');
    hglow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hglow;
    ctx.fillRect(0, 0, w, h);

    // Moon
    const moonX = w * 0.82, moonY = h * 0.18;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 60);
    moonGlow.addColorStop(0, 'rgba(255,250,200,0.25)');
    moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffde0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 24, 0, Math.PI * 2);
    ctx.fill();
    // Crater
    ctx.fillStyle = 'rgba(200,195,150,0.4)';
    ctx.beginPath(); ctx.arc(moonX + 8, moonY - 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX - 7, moonY + 8, 3, 0, Math.PI * 2); ctx.fill();

    // Stars
    stars.forEach(s => {
      s.twinkle += s.speed;
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.6;
      ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Silhouette trees
    ctx.fillStyle = '#030c04';
    drawTree(ctx, w * 0.05, h * 0.58, 30, 80);
    drawTree(ctx, w * 0.08, h * 0.58, 20, 60);
    drawTree(ctx, w * 0.92, h * 0.58, 28, 75);
    drawTree(ctx, w * 0.96, h * 0.58, 18, 50);
  }

  function drawTree(ctx, x, y, w, h) {
    ctx.fillRect(x - 3, y - h * 0.3, 6, h * 0.35);
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - w / 2, y - h * 0.3);
    ctx.lineTo(x + w / 2, y - h * 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.8);
    ctx.lineTo(x - w * 0.65, y - h * 0.15);
    ctx.lineTo(x + w * 0.65, y - h * 0.15);
    ctx.fill();
  }

  function drawFireflies() {
    fireflies.forEach(f => {
      const alpha = 0.5 + Math.sin(f.phase) * 0.5;
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 8);
      glow.addColorStop(0, `rgba(200, 255, 100, ${alpha * 0.8})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(220, 255, 80, ${alpha})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawSleepingHorse(horse, index, total) {
    // Lay horses out evenly
    const spacing = (canvas.width - 100) / Math.max(total, 1);
    const bx = 80 + index * spacing;
    const by = canvas.height * 0.72;

    ctx.save();
    ctx.translate(bx, by);

    const c = horse.color || '#8B5E3C';

    // Shadow / ground indent
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (lying on side, ellipse rotated)
    ctx.save();
    ctx.rotate(0.15);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Legs folded
    ctx.strokeStyle = c;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(24, 20); ctx.lineTo(18, 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 10); ctx.lineTo(14, 22); ctx.lineTo(8, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(-24, 22); ctx.lineTo(-18, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-20, 8); ctx.lineTo(-30, 20); ctx.lineTo(-24, 28); ctx.stroke();

    // Neck & head (resting)
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(30, -10);
    ctx.lineTo(44, 0);
    ctx.lineTo(40, 10);
    ctx.lineTo(26, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(48, 2, 14, 9, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye (closed - curved line)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(54, 0, 3, Math.PI, 0);
    ctx.stroke();

    // Tail
    ctx.strokeStyle = shadeColor(c, -40);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-38, -5);
    ctx.bezierCurveTo(-52, -2, -55, 10, -46, 18);
    ctx.stroke();

    // Mane (laying flat)
    ctx.fillStyle = shadeColor(c, -40);
    ctx.beginPath();
    ctx.moveTo(34, -14);
    ctx.bezierCurveTo(20, -18, 6, -16, -2, -10);
    ctx.bezierCurveTo(6, -12, 20, -14, 34, -14);
    ctx.fill();

    // ZZZ bubbles
    const t = frameCount * 0.03 + index * 1.2;
    ['z', 'z', 'Z'].forEach((letter, j) => {
      const alpha = Math.max(0, Math.sin(t - j * 0.8)) ;
      const offsetY = -40 - j * 16 - ((t * 20 + j * 50) % 60);
      if (alpha > 0.05) {
        ctx.fillStyle = `rgba(180, 210, 255, ${alpha * 0.9})`;
        ctx.font = `${12 + j * 4}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(letter, 50 + j * 8, offsetY);
      }
    });

    // Status badges
    ctx.restore();
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#88aaff';
    ctx.fillText(horse.name, bx, by - 52);
    if (horse.injured) {
      ctx.fillStyle = '#ff6666';
      ctx.fillText('🩹 Healing...', bx, by - 38);
    } else {
      ctx.fillStyle = '#66ff88';
      ctx.fillText('💤 Resting', bx, by - 38);
    }
    ctx.restore();
  }

  function shadeColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `rgb(${r},${g},${b})`;
  }

  function drawInfoPanel(horses) {
    const now = Date.now();
    const elapsed = now - (lastTickTime || now);
    const remaining = Math.max(0, TICK_INTERVAL_MS - elapsed);
    const progress = 1 - remaining / TICK_INTERVAL_MS;

    const px = 10, py = canvas.height - 55, pw = canvas.width - 20, ph = 50;
    ctx.fillStyle = 'rgba(5, 8, 30, 0.7)';
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 8);
    ctx.fill();

    ctx.fillStyle = '#6688cc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Sleep cycle progress:', px + 10, py + 18);

    // Progress bar
    ctx.fillStyle = '#1a2255';
    ctx.fillRect(px + 10, py + 24, pw - 20, 12);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(px + 10, py + 24, (pw - 20) * progress, 12);

    const secs = Math.ceil(remaining / 1000);
    ctx.fillStyle = '#aabbff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Next tick in ${secs}s`, px + pw - 10, py + 34);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#557799';
    ctx.font = '10px monospace';
    ctx.fillText(`💤 Sleeping heals injuries | Ages horses | Ticks statuses`, px + 10, py + 46);
  }

  function loop() {
    frameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const horses = (window.GrazeModule && window.GrazeModule.getHorses())
      ? window.GrazeModule.getHorses()
      : [
          { name: 'Shadowmere', color: '#3a2a1a', injured: false, health: 80, hunger: 60, mood: 'content', sleepTicks: 0 },
          { name: 'Blaze',      color: '#c0602a', injured: true,  health: 40, hunger: 50, mood: 'content', sleepTicks: 0 },
          { name: 'Snowflake',  color: '#d4d0c8', injured: false, health: 95, hunger: 40, mood: 'content', sleepTicks: 0 },
        ];

    // Sleep tick
    const now = Date.now();
    if (lastTickTime && now - lastTickTime >= TICK_INTERVAL_MS) {
      sleepTick(horses);
      lastTickTime = now;
      console.log('🌙 Sleep tick fired — horses healed/aged');
    }

    updateFireflies();
    drawNightBackground();
    drawFireflies();
    horses.forEach((h, i) => drawSleepingHorse(h, i, horses.length));
    drawInfoPanel(horses);

    animId = requestAnimationFrame(loop);
  }

  function mount(parentEl) {
    container = parentEl;
    container.innerHTML = '';

    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.cssText = `
      width: 100%;
      max-width: 800px;
      display: block;
      border: 2px solid rgba(60, 80, 160, 0.5);
      border-radius: 12px;
      background: #050818;
    `;
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    const tip = document.createElement('p');
    tip.style.cssText = 'color: #556688; font-size: 0.85em; margin: 8px 0 0; text-align: center;';
    tip.textContent = '🌙 Your horses are sleeping — injuries heal, horses age, statuses tick every 10 seconds.';
    container.appendChild(tip);

    initScene();
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function unmount() {
    if (animId) cancelAnimationFrame(animId);
    if (container) container.innerHTML = '';
  }

  return { mount, unmount };
})();

window.SleepModule = SleepModule;
console.log('✅ sleep.js loaded');