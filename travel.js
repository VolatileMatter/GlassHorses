// === TRAVEL MODE - Endless Runner ===

const TravelGame = (() => {
  // --- Constants ---
  const GRAVITY = 0.6;
  const JUMP_FORCE = -13;
  const GROUND_Y = 300; // y position of ground surface
  const HORSE_WIDTH = 60;
  const HORSE_HEIGHT = 50;
  const ROCK_WIDTH = 40;
  const ROCK_HEIGHT = 50;
  const SPEED_INITIAL = 5;
  const SPEED_INCREMENT = 0.0005;

  // --- State ---
  let canvas, ctx;
  let horses = [];
  let rocks = [];
  let gameSpeed = SPEED_INITIAL;
  let frameCount = 0;
  let score = 0;
  let running = false;
  let animFrameId = null;
  let nextRockIn = 80;
  let container = null;

  // --- Horse Class ---
  class Horse {
    constructor(name, x, color) {
      this.name = name;
      this.x = x;
      this.y = GROUND_Y - HORSE_HEIGHT;
      this.vy = 0;
      this.onGround = true;
      this.dead = false;
      this.color = color || '#8B5E3C';
      this.legPhase = Math.random() * Math.PI * 2;
      this.deathTimer = 0;
    }

    jump() {
      if (this.onGround && !this.dead) {
        this.vy = JUMP_FORCE;
        this.onGround = false;
      }
    }

    update() {
      if (this.dead) {
        this.deathTimer++;
        return;
      }
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y >= GROUND_Y - HORSE_HEIGHT) {
        this.y = GROUND_Y - HORSE_HEIGHT;
        this.vy = 0;
        this.onGround = true;
      }
      this.legPhase += 0.25;
    }

    draw(ctx) {
      const alpha = this.dead ? Math.max(0, 1 - this.deathTimer / 30) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;

      // *** FIX: translate to world position first ***
      ctx.translate(this.x, this.y);

      if (this.dead) {
        // Tumbling: rotate around horse centre
        ctx.translate(HORSE_WIDTH / 2, HORSE_HEIGHT / 2);
        ctx.rotate(this.deathTimer * 0.15);
        ctx.translate(-HORSE_WIDTH / 2, -HORSE_HEIGHT / 2);
      }

      const c = this.color;

      // Body
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(30, 25, 28, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(48, 15);
      ctx.lineTo(56, 5);
      ctx.lineTo(62, 8);
      ctx.lineTo(54, 20);
      ctx.fill();

      // Head
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(58, 6, 10, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(62, 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Nostril
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath();
      ctx.arc(67, 7, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Mane
      ctx.fillStyle = '#3a2010';
      ctx.beginPath();
      ctx.moveTo(50, 3);
      ctx.bezierCurveTo(46, -4, 40, -3, 35, 2);
      ctx.bezierCurveTo(40, 1, 46, 0, 50, 3);
      ctx.fill();

      // Tail
      ctx.strokeStyle = '#3a2010';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, 20);
      ctx.bezierCurveTo(-8, 15, -10, 30, -4, 38);
      ctx.stroke();

      // Legs with animation
      ctx.strokeStyle = c;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const lp = this.onGround ? this.legPhase : 0;
      // Front legs
      this._drawLeg(ctx, 42, 38, Math.sin(lp) * 12);
      this._drawLeg(ctx, 35, 38, Math.sin(lp + Math.PI) * 12);
      // Back legs
      this._drawLeg(ctx, 16, 38, Math.sin(lp + Math.PI) * 12);
      this._drawLeg(ctx, 9, 38, Math.sin(lp) * 12);

      ctx.restore();
    }

    _drawLeg(ctx, bx, by, swing) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + swing * 0.4, by + 14);
      ctx.lineTo(bx + swing * 0.6, by + 26);
      ctx.stroke();
    }

    getBounds() {
      return { x: this.x + 8, y: this.y + 5, w: HORSE_WIDTH - 12, h: HORSE_HEIGHT - 8 };
    }
  }

  // --- Rock Class ---
  class Rock {
    constructor(x) {
      this.x = x;
      this.h = 30 + Math.random() * 30;
      this.w = ROCK_WIDTH + Math.random() * 20;
      this.y = GROUND_Y - this.h;
    }

    update() {
      this.x -= gameSpeed;
    }

    draw(ctx) {
      const { x, y, w, h } = this;
      // Rock body
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.15, y + h);
      ctx.lineTo(x, y + h * 0.6);
      ctx.lineTo(x + w * 0.1, y + h * 0.2);
      ctx.lineTo(x + w * 0.4, y);
      ctx.lineTo(x + w * 0.75, y + h * 0.1);
      ctx.lineTo(x + w, y + h * 0.5);
      ctx.lineTo(x + w * 0.85, y + h);
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y + h * 0.15);
      ctx.lineTo(x + w * 0.6, y + h * 0.05);
      ctx.lineTo(x + w * 0.7, y + h * 0.3);
      ctx.lineTo(x + w * 0.35, y + h * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    getBounds() {
      return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 4 };
    }

    isOffScreen() {
      return this.x + this.w < 0;
    }
  }

  // --- Collision ---
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // --- Draw Background ---
  function drawBackground() {
    const w = canvas.width;
    const h = canvas.height;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#4a90d9');
    skyGrad.addColorStop(1, '#87ceeb');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, GROUND_Y);

    // Clouds (static, simple)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    drawCloud(ctx, 80, 50, 60);
    drawCloud(ctx, 250, 30, 45);
    drawCloud(ctx, 450, 60, 70);
    drawCloud(ctx, 650, 35, 55);

    // Ground
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, h);
    groundGrad.addColorStop(0, '#6b4423');
    groundGrad.addColorStop(0.3, '#5a3718');
    groundGrad.addColorStop(1, '#3d2510');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);

    // Ground top strip
    ctx.fillStyle = '#7a5030';
    ctx.fillRect(0, GROUND_Y, w, 6);

    // Dust particles (subtle lines)
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const px = ((frameCount * gameSpeed * (0.5 + i * 0.2)) % (w + 40)) - 20;
      const py = GROUND_Y + 10 + i * 12;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 25, py);
      ctx.stroke();
    }
  }

  function drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- HUD ---
  function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, 32);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}`, 12, 21);
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 130, 21);
    const alive = horses.filter(h => !h.dead).length;
    ctx.fillText(`Horses: ${alive}/${horses.length}`, 260, 21);
    const herdName = window.HorseManager?.getActiveHerd()?.meta?.herd_name || '';
    if (herdName) {
      ctx.fillStyle = '#aaffcc';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(herdName, canvas.width / 2, 20);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
    }
    ctx.textAlign = 'right';
    ctx.fillText('SPACE / TAP = Jump', canvas.width - 10, 21);
    ctx.textAlign = 'left';
  }

  // --- Game Over Screen ---
  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ALL HORSES DOWN', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.font = '18px monospace';
    ctx.fillText('Press SPACE or tap to restart', canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = 'left';
  }

  // --- Main Loop ---
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    const allDead = horses.length > 0 && horses.every(h => h.dead);

    if (!allDead) {
      gameSpeed = SPEED_INITIAL + frameCount * SPEED_INCREMENT;
      score += gameSpeed * 0.05;

      // Spawn rocks
      nextRockIn--;
      if (nextRockIn <= 0) {
        rocks.push(new Rock(canvas.width + 20));
        nextRockIn = Math.floor(60 + Math.random() * 80);
      }

      // Update
      rocks.forEach(r => r.update());
      rocks = rocks.filter(r => !r.isOffScreen());
      horses.forEach(h => h.update());

      // Collision
      horses.forEach(horse => {
        if (horse.dead) return;
        const hb = horse.getBounds();
        rocks.forEach(rock => {
          if (rectsOverlap(hb, rock.getBounds())) {
            horse.dead = true;
          }
        });
      });
    }

    // Draw
    drawBackground();
    rocks.forEach(r => r.draw(ctx));
    horses.forEach(h => h.draw(ctx));
    drawHUD();

    if (allDead && horses.every(h => h.deathTimer > 30)) {
      drawGameOver();
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  // --- Jump all alive horses ---
  function jumpAll() {
    const allDead = horses.length > 0 && horses.every(h => h.dead);
    if (allDead) {
      startGame();
      return;
    }
    horses.forEach(h => h.jump());
  }

  // --- Staggered jump (more interesting) ---
  function staggeredJump() {
    const allDead = horses.length > 0 && horses.every(h => h.dead);
    if (allDead) { startGame(); return; }
    horses.forEach((h, i) => {
      setTimeout(() => h.jump(), i * 60);
    });
  }

  // --- Init ---
  function startGame() {
    frameCount = 0;
    score = 0;
    gameSpeed = SPEED_INITIAL;
    rocks = [];
    nextRockIn = 100;

    // Build horses from HorseManager, then GrazeModule, then fallback
    const source = (window.HorseManager && window.HorseManager.getHorses().length > 0)
      ? window.HorseManager.getHorses()
      : (window.GrazeModule && window.GrazeModule.getHorses().length > 0)
        ? window.GrazeModule.getHorses()
        : [
            { barn_name: 'Shadowmere', color: '#3a2a1a' },
            { barn_name: 'Blaze',      color: '#c0602a' },
            { barn_name: 'Snowflake',  color: '#d4d0c8' },
          ];

    const colors = ['#8B5E3C', '#c0602a', '#3a2a1a', '#d4d0c8', '#7a6040'];
    horses = source.map((h, i) => new Horse(
      h.barn_name || h.name || `Horse ${i + 1}`,
      60 + i * 15,
      h.color || colors[i % colors.length]
    ));
  }

  // --- Mount UI ---
  function mount(parentEl) {
    container = parentEl;
    container.innerHTML = '';

    // Canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.cssText = `
      width: 100%;
      max-width: 800px;
      display: block;
      border: 2px solid rgba(0,255,255,0.3);
      border-radius: 12px;
      cursor: pointer;
      background: #4a90d9;
    `;
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    // Instructions
    const tip = document.createElement('p');
    tip.style.cssText = 'color: #aaa; font-size: 0.85em; margin: 8px 0 0; text-align: center;';
    tip.textContent = 'Press SPACE or click/tap the canvas to make your horses jump over rocks.';
    container.appendChild(tip);

    // Input
    document.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', staggeredJump);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); staggeredJump(); }, { passive: false });

    startGame();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    gameLoop();
  }

  function handleKey(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      staggeredJump();
    }
  }

  // --- Unmount ---
  function unmount() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    document.removeEventListener('keydown', handleKey);
    if (container) container.innerHTML = '';
    running = false;
  }

  return { mount, unmount };
})();

window.TravelGame = TravelGame;
console.log('✅ travel.js loaded');