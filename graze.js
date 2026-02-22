// === GRAZE MODE ===
// Default state. Horses wander a pasture and eat grass.

const GrazeModule = (() => {
  const FALLBACK_HORSES = [
    { id: 'f1', name: 'Shadowmere', barn_name: 'Shadowmere', color: '#3a2a1a', hunger: 80, health: 100, mood: 'content', injured: false, age: 3 },
    { id: 'f2', name: 'Blaze',      barn_name: 'Blaze',      color: '#c0602a', hunger: 55, health: 100, mood: 'happy',   injured: false, age: 5 },
    { id: 'f3', name: 'Snowflake',  barn_name: 'Snowflake',  color: '#d4d0c8', hunger: 30, health: 90,  mood: 'hungry',  injured: false, age: 2 },
  ];
  let horses = [];

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
    const source = (window.HorseManager && window.HorseManager.getHorses().length > 0)
      ? window.HorseManager.getHorses()
      : FALLBACK_HORSES;
    
    console.log('Initializing graze with', source.length, 'horses');
    
    horses = source.map((h, i) => ({
      ...h,
      name: h.barn_name || h.name || `Horse ${i + 1}`,
      x: 80 + i * Math.floor((PASTURE_W - 160) / Math.max(source.length - 1, 1)),
      y: PASTURE_H * 0.65 + Math.random() * 60,
      vx: (Math.random() - 0.5) * SPEED * 2,
      vy: (Math.random() - 0.5) * SPEED * 0.4,
      grazeTimer: Math.floor(Math.random() * 120),
      legPhase: Math.random() * Math.PI * 2,
      state: h.state || 'walk',
      eatTimer: h.eatTimer || 0,
    }));
  }

  // ---- Status colour ----
  function statusColor(h) {
    if (h.injured || h.health < 30) return '#e03030';
    if (h.health < 70 || h.hunger < 30) return '#d4a017';
    return '#2ecc71';
  }

  // ---- Update ----
  function updateGrass() {
    grassTufts.forEach(g => {
      g.sway += 0.03;
      if (g.eaten) {
        g.regrowTimer--;
        if (g.regrowTimer <= 0) { g.eaten = false; g.h = 6 + Math.random() * 10; }
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

      horse.legPhase = (horse.legPhase || 0) + 0.12;
      horse.x += horse.vx;
      horse.y += horse.vy;

      if (horse.x < MARGIN) { horse.x = MARGIN; horse.vx = Math.abs(horse.vx); }
      if (horse.x > PASTURE_W - MARGIN) { horse.x = PASTURE_W - MARGIN; horse.vx = -Math.abs(horse.vx); }
      if (horse.y < PASTURE_H * 0.5) { horse.y = PASTURE_H * 0.5; horse.vy = Math.abs(horse.vy) * 0.5; }
      if (horse.y > PASTURE_H * 0.92) { horse.y = PASTURE_H * 0.92; horse.vy = -Math.abs(horse.vy) * 0.5; }

      if (Math.random() < 0.01) {
        horse.vx += (Math.random() - 0.5) * 0.5;
        horse.vy += (Math.random() - 0.5) * 0.2;
        const spd = Math.sqrt(horse.vx ** 2 + horse.vy ** 2);
        if (spd > 0) { horse.vx = (horse.vx / spd) * SPEED; horse.vy = (horse.vy / spd) * SPEED * 0.3; }
      }

      if (horse.grazeTimer <= 0) {
        horse.state = 'eat';
        horse.grazeTimer = 60 + Math.floor(Math.random() * 120);
        horse.vx = 0; horse.vy = 0;
      }

      if (horse.hunger > 70) horse.mood = 'happy';
      else if (horse.hunger > 40) horse.mood = 'content';
      else horse.mood = 'hungry';

      if (frameCount % 120 === 0) horse.hunger = Math.max(0, horse.hunger - 1);
    });
  }

  // ---- Draw functions (keep your existing draw code) ----
  function drawBackground() {
    // Your existing drawBackground code
    const w = canvas.width, h = canvas.height;
    
    // Sky
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, PASTURE_H * 0.45);
    
    // Ground
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, PASTURE_H * 0.45, w, h - PASTURE_H * 0.45);
  }

  function drawGrass() {
    grassTufts.forEach(g => {
      if (g.eaten) return;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x, g.y - g.h);
      ctx.stroke();
    });
  }

  function drawHorse(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    
    // Body (simplified black and white)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    
    // Simple horse shape
    ctx.fillRect(-15, -25, 30, 15);
    ctx.fillRect(10, -35, 15, 10); // neck
    ctx.fillRect(20, -40, 10, 10); // head
    
    // Legs
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(-10, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(10, 5);
    ctx.stroke();
    
    ctx.restore();
    
    // Name label
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(h.barn_name || h.name || '', h.x, h.y - 45);
    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateGrass();
    updateHorses();
    drawBackground();
    drawGrass();
    horses.forEach(drawHorse);
    animId = requestAnimationFrame(loop);
  }

  function getHorses() { return horses; }

  function mount(parentEl) {
    container = parentEl;
    
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }
    
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 360;
    canvas.style.cssText = 'width:100%;max-width:800px;display:block;background:#000;border:1px solid #333;';
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    initGrass();
    initHorsePositions();
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function unmount() {
    if (animId) cancelAnimationFrame(animId);
    if (container) {
      const canvas = container.querySelector('canvas');
      if (canvas) canvas.remove();
    }
  }

  return { mount, unmount, getHorses };
})();

window.GrazeModule = GrazeModule;
console.log('graze.js loaded');