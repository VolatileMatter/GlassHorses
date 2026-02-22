// === GRAZE MODE ===
// Horses wander a pasture, eating grass. Default state.
// Horses must be grazing to breed.

const GrazeModule = (() => {
  // --- Horse data (shared across modules) ---
  // In a real app this would come from Supabase / Drive saves
  let horses = [
    { id: 1, name: 'Shadowmere', color: '#3a2a1a', hunger: 80, health: 100, mood: 'content', x: 0, y: 0, vx: 0, vy: 0, grazeTimer: 0, eatTimer: 0, state: 'walk', injured: false, age: 3 },
    { id: 2, name: 'Blaze',      color: '#c0602a', hunger: 55, health: 100, mood: 'happy',   x: 0, y: 0, vx: 0, vy: 0, grazeTimer: 0, eatTimer: 0, state: 'eat',  injured: false, age: 5 },
    { id: 3, name: 'Snowflake',  color: '#d4d0c8', hunger: 30, health: 90,  mood: 'hungry',  x: 0, y: 0, vx: 0, vy: 0, grazeTimer: 0, eatTimer: 0, state: 'walk', injured: false, age: 2 },
  ];

  const PASTURE_W = 760;
  const PASTURE_H = 300;
  const MARGIN = 40;
  const SPEED = 0.7;

  let canvas, ctx, animId, container;
  let grassTufts = [];
  let frameCount = 0;

  // ---- Grass ----
  function initGrass() {
    grassTufts = [];
    for (let i = 0; i < 60; i++) {
      grassTufts.push({
        x: MARGIN + Math.random() * (PASTURE_W - MARGIN * 2),
        y: PASTURE_H * 0.5 + Math.random() * (PASTURE_H * 0.45),
        h: 6 + Math.random() * 10,
        sway: Math.random() * Math.PI * 2,
        eaten: false,
        regrowTimer: 0,
      });
    }
  }

  function initHorsePositions() {
    horses.forEach((h, i) => {
      h.x = 100 + i * 200;
      h.y = PASTURE_H * 0.65 + Math.random() * 60;
      const angle = Math.random() * Math.PI * 2;
      h.vx = Math.cos(angle) * SPEED;
      h.vy = Math.sin(angle) * SPEED * 0.3;
      h.grazeTimer = Math.floor(Math.random() * 120);
      h.legPhase = Math.random() * Math.PI * 2;
    });
  }

  // ---- Update ----
  function updateGrass() {
    grassTufts.forEach(g => {
      g.sway += 0.03;
      if (g.eaten) {
        g.regrowTimer--;
        if (g.regrowTimer <= 0) {
          g.eaten = false;
          g.h = 6 + Math.random() * 10;
        }
      }
    });
  }

  function updateHorses() {
    frameCount++;
    horses.forEach(horse => {
      horse.grazeTimer--;

      if (horse.state === 'eat') {
        horse.eatTimer = (horse.eatTimer || 0) + 1;
        horse.legPhase = 0;
        // Eat nearby grass
        if (horse.eatTimer % 30 === 0) {
          horse.hunger = Math.min(100, horse.hunger + 5);
          const nearby = grassTufts.find(g => !g.eaten && Math.abs(g.x - horse.x) < 25 && Math.abs(g.y - horse.y) < 20);
          if (nearby) { nearby.eaten = true; nearby.regrowTimer = 300; }
        }
        if (horse.grazeTimer <= 0) {
          horse.state = 'walk';
          horse.grazeTimer = 60 + Math.floor(Math.random() * 180);
          horse.eatTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          horse.vx = Math.cos(angle) * SPEED;
          horse.vy = Math.sin(angle) * SPEED * 0.3;
        }
        return;
      }

      // Walk
      horse.legPhase = (horse.legPhase || 0) + 0.12;
      horse.x += horse.vx;
      horse.y += horse.vy;

      // Bounce off pasture edges
      if (horse.x < MARGIN) { horse.x = MARGIN; horse.vx = Math.abs(horse.vx); }
      if (horse.x > PASTURE_W - MARGIN) { horse.x = PASTURE_W - MARGIN; horse.vx = -Math.abs(horse.vx); }
      if (horse.y < PASTURE_H * 0.5) { horse.y = PASTURE_H * 0.5; horse.vy = Math.abs(horse.vy) * 0.5; }
      if (horse.y > PASTURE_H * 0.92) { horse.y = PASTURE_H * 0.92; horse.vy = -Math.abs(horse.vy) * 0.5; }

      // Random direction nudge
      if (Math.random() < 0.01) {
        horse.vx += (Math.random() - 0.5) * 0.5;
        horse.vy += (Math.random() - 0.5) * 0.2;
        const spd = Math.sqrt(horse.vx ** 2 + horse.vy ** 2);
        horse.vx = (horse.vx / spd) * SPEED;
        horse.vy = (horse.vy / spd) * SPEED * 0.3;
      }

      // Decide to eat
      if (horse.grazeTimer <= 0) {
        horse.state = 'eat';
        horse.grazeTimer = 60 + Math.floor(Math.random() * 120);
        horse.vx = 0;
        horse.vy = 0;
      }

      // Mood
      if (horse.hunger > 70) horse.mood = 'happy';
      else if (horse.hunger > 40) horse.mood = 'content';
      else horse.mood = 'hungry';

      // Slow hunger decay
      if (frameCount % 120 === 0) horse.hunger = Math.max(0, horse.hunger - 1);
    });
  }

  // ---- Draw ----
  function drawBackground() {
    const w = canvas.width, h = canvas.height;

    // Sky strip
    const sky = ctx.createLinearGradient(0, 0, 0, PASTURE_H * 0.45);
    sky.addColorStop(0, '#a8d8a8');
    sky.addColorStop(1, '#c8e8a8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, PASTURE_H * 0.45);

    // Ground
    const ground = ctx.createLinearGradient(0, PASTURE_H * 0.45, 0, h);
    ground.addColorStop(0, '#5a9e3a');
    ground.addColorStop(0.3, '#4a8e2a');
    ground.addColorStop(1, '#3a6e1a');
    ctx.fillStyle = ground;
    ctx.fillRect(0, PASTURE_H * 0.45, w, h - PASTURE_H * 0.45);

    // Gentle rolling hill horizon
    ctx.fillStyle = '#5a9e3a';
    ctx.beginPath();
    ctx.moveTo(0, PASTURE_H * 0.48);
    ctx.bezierCurveTo(w * 0.25, PASTURE_H * 0.42, w * 0.5, PASTURE_H * 0.5, w * 0.75, PASTURE_H * 0.44);
    ctx.bezierCurveTo(w * 0.88, PASTURE_H * 0.40, w, PASTURE_H * 0.46, w, PASTURE_H * 0.48);
    ctx.lineTo(w, PASTURE_H * 0.55);
    ctx.lineTo(0, PASTURE_H * 0.55);
    ctx.fill();

    // Fence posts
    ctx.fillStyle = '#8B6914';
    for (let fx = 0; fx < w; fx += 80) {
      ctx.fillRect(fx, PASTURE_H * 0.62, 8, 40);
    }
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, PASTURE_H * 0.68);
    ctx.lineTo(w, PASTURE_H * 0.68);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, PASTURE_H * 0.75);
    ctx.lineTo(w, PASTURE_H * 0.75);
    ctx.stroke();
  }

  function drawGrass() {
    grassTufts.forEach(g => {
      if (g.eaten) return;
      const sway = Math.sin(g.sway) * 2;
      ctx.strokeStyle = '#2d7a1a';
      ctx.lineWidth = 1.5;
      for (let b = -1; b <= 1; b++) {
        ctx.beginPath();
        ctx.moveTo(g.x + b * 4, g.y);
        ctx.quadraticCurveTo(g.x + b * 4 + sway, g.y - g.h * 0.5, g.x + b * 4 + sway * 1.5, g.y - g.h);
        ctx.stroke();
      }
    });
  }

  function drawHorse(h) {
    ctx.save();
    const facingRight = h.vx >= 0 || h.state === 'eat';
    ctx.translate(h.x, h.y);
    if (!facingRight) ctx.scale(-1, 1);

    const c = h.color;
    const lp = h.legPhase || 0;
    const eating = h.state === 'eat';

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, -22, 26, 15, eating ? 0.2 : 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = c;
    ctx.beginPath();
    if (eating) {
      ctx.moveTo(16, -30);
      ctx.lineTo(22, -10);
      ctx.lineTo(28, -12);
      ctx.lineTo(22, -32);
    } else {
      ctx.moveTo(16, -30);
      ctx.lineTo(20, -44);
      ctx.lineTo(26, -42);
      ctx.lineTo(22, -28);
    }
    ctx.fill();

    // Head
    ctx.fillStyle = c;
    if (eating) {
      ctx.beginPath();
      ctx.ellipse(30, -8, 11, 7, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(34, -10, 1.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(24, -48, 10, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(30, -50, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // Mane
    ctx.fillStyle = shadeColor(c, -40);
    ctx.beginPath();
    if (eating) {
      ctx.moveTo(18, -32); ctx.bezierCurveTo(12, -36, 4, -34, 0, -28);
      ctx.bezierCurveTo(4, -30, 12, -32, 18, -32);
    } else {
      ctx.moveTo(20, -42); ctx.bezierCurveTo(14, -48, 6, -46, 2, -38);
      ctx.bezierCurveTo(8, -40, 14, -44, 20, -42);
    }
    ctx.fill();

    // Tail
    ctx.strokeStyle = shadeColor(c, -40);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-22, -28);
    ctx.bezierCurveTo(-36, -22, -38, -12, -30, -4);
    ctx.stroke();

    // Legs
    ctx.strokeStyle = c;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    if (eating) {
      // Splayed grazing stance
      drawLeg(ctx, 12, -10, 0, 28);
      drawLeg(ctx, 5, -10, 3, 28);
      drawLeg(ctx, -10, -10, -3, 28);
      drawLeg(ctx, -18, -10, 0, 28);
    } else {
      const s = Math.sin(lp);
      drawLeg(ctx, 12, -10, s * 10, 28);
      drawLeg(ctx, 5, -10, -s * 10, 28);
      drawLeg(ctx, -10, -10, -s * 10, 28);
      drawLeg(ctx, -18, -10, s * 10, 28);
    }

    // Mood emoji
    const moods = { happy: '😄', content: '😊', hungry: '😟' };
    ctx.restore();
    ctx.save();
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText(moods[h.mood] || '😊', h.x, h.y - 55);
    ctx.restore();

    // Name label
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.name, h.x, h.y - 68);
    ctx.restore();
  }

  function drawLeg(ctx, bx, by, swing, len) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + swing * 0.5, by + len * 0.5);
    ctx.lineTo(bx + swing * 0.7, by + len);
    ctx.stroke();
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

  function drawStatsPanel() {
    const panelX = 5;
    const panelY = canvas.height - 70;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, canvas.width - 10, 65, 8);
    ctx.fill();

    horses.forEach((h, i) => {
      const col = panelX + 10 + i * 255;
      ctx.fillStyle = h.color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(h.name, col, panelY + 16);

      // Hunger bar
      ctx.fillStyle = '#333';
      ctx.fillRect(col, panelY + 22, 120, 8);
      const hungerColor = h.hunger > 60 ? '#4caf50' : h.hunger > 30 ? '#ff9800' : '#f44336';
      ctx.fillStyle = hungerColor;
      ctx.fillRect(col, panelY + 22, h.hunger * 1.2, 8);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText(`🌿 ${Math.floor(h.hunger)}%`, col + 126, panelY + 30);

      // Health bar
      ctx.fillStyle = '#333';
      ctx.fillRect(col, panelY + 36, 120, 8);
      ctx.fillStyle = '#e91e63';
      ctx.fillRect(col, panelY + 36, h.health * 1.2, 8);
      ctx.fillStyle = '#aaa';
      ctx.fillText(`❤️ ${Math.floor(h.health)}%`, col + 126, panelY + 44);

      ctx.fillStyle = '#ccc';
      const breedable = h.hunger >= 50 && !h.injured;
      ctx.fillText(breedable ? '✅ Can breed' : '❌ Not ready', col, panelY + 58);
    });
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateGrass();
    updateHorses();
    drawBackground();
    drawGrass();
    horses.forEach(drawHorse);
    drawStatsPanel();
    animId = requestAnimationFrame(loop);
  }

  // ---- Public API ----
  function getHorses() {
    return horses;
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
      border: 2px solid rgba(100,200,80,0.4);
      border-radius: 12px;
      background: #a8d8a8;
    `;
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    const tip = document.createElement('p');
    tip.style.cssText = 'color: #aaa; font-size: 0.85em; margin: 8px 0 0; text-align: center;';
    tip.textContent = 'Your horses are grazing 🌿 — hungry horses will eat; well-fed horses can breed.';
    container.appendChild(tip);

    initGrass();
    initHorsePositions();
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function unmount() {
    if (animId) cancelAnimationFrame(animId);
    if (container) container.innerHTML = '';
  }

  return { mount, unmount, getHorses };
})();

window.GrazeModule = GrazeModule;
console.log('✅ graze.js loaded');