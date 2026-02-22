// === TRAVEL MODE — Main Orchestrator ===
// Coordinates all travel sub-modules:
//   TravelConstants, TravelBackground, TravelHorse, TravelObstacles,
//   TravelApples, TravelCheckpoints, TravelHUD

const TravelGame = (() => {

  // --- State ---
  let canvas, ctx;
  let horses = [];
  let gameSpeed = 0;
  let frameCount = 0;
  let score = 0;
  let animFrameId = null;
  let container = null;
  let gameOver = false;
  let currentBiomeId = 'plains';

  // Input state
  let spaceHeld = false;

  // ---- Helpers ----
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---- Build horses from HorseManager ----
  function buildHorses() {
    const C = window.TravelConstants;

    const source = (window.HorseManager && window.HorseManager.getHorses().length > 0)
      ? window.HorseManager.getHorses()
      : [
          { id: 'f1', barn_name: 'Shadowmere', color: '#3a2a1a' },
          { id: 'f2', barn_name: 'Blaze',      color: '#c0602a' },
          { id: 'f3', barn_name: 'Snowflake',  color: '#d4d0c8' },
        ];

    // Filter out horses that are exhausted (energy === 0 && travelExhausted)
    const eligible = source.filter(h => !h.travelExhausted);
    const pool = eligible.length > 0 ? eligible : source; // fallback: use all

    // Position horses in the centre-left area, staggered slightly
    const canvasMid = 340; // mid-point x for lead horse
    const spacing = 18;

    horses = pool.map((h, i) => {
      const isLead = i === 0;
      const xPos = canvasMid - i * spacing;
      return new window.TravelHorse.Horse(h, xPos, isLead);
    });
  }

  // ---- Start / Restart ----
  function startGame() {
    const C = window.TravelConstants;
    frameCount = 0;
    score = 0;
    gameSpeed = C.SPEED_INITIAL;
    gameOver = false;
    spaceHeld = false;

    window.TravelBackground.init(currentBiomeId);
    window.TravelObstacles.reset(currentBiomeId);
    window.TravelApples.reset();
    window.TravelCheckpoints.reset();
    buildHorses();
  }

  // ---- Input ----
  function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameOver) { startGame(); return; }
      if (!spaceHeld) {
        spaceHeld = true;
        const lead = horses.find(h => h.isLead && !h.dead);
        if (lead) lead.startJump();
      }
    }
  }

  function handleKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (spaceHeld) {
        spaceHeld = false;
        _doJump();
      }
    }
  }

  function handleTap() {
    if (gameOver) { startGame(); return; }
    // Tap = instant small jump
    const lead = horses.find(h => h.isLead && !h.dead);
    if (lead) {
      lead.startJump();
      lead.jumpHoldFrames = 0;
      _doJump();
    }
  }

  function _doJump() {
    const lead = horses.find(h => h.isLead && !h.dead);
    if (!lead) return;
    const force = lead.releaseJump();
    if (force === undefined) return; // wasn't jumping

    // Stagger followers: each copies the lead jump with a slight delay
    horses.forEach((h, i) => {
      if (!h.isLead && !h.dead) {
        h.scheduleFollowerJump(force, i * 55);
      }
    });
  }

  // ---- Main Loop ----
  function gameLoop() {
    animFrameId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    const C = window.TravelConstants;
    const allDead = horses.length > 0 && horses.every(h => h.dead);

    if (!allDead && !gameOver) {
      // Advance speed
      gameSpeed = Math.min(C.SPEED_MAX, C.SPEED_INITIAL + frameCount * C.SPEED_INCREMENT);
      score += gameSpeed * 0.045;

      // Update subsystems
      window.TravelBackground.update(gameSpeed);
      window.TravelObstacles.update(canvas.width, gameSpeed);
      window.TravelApples.update(canvas.width, gameSpeed);
      horses.forEach(h => h.update());

      // Space held — keep charging for lead
      if (spaceHeld) {
        const lead = horses.find(h => h.isLead && !h.dead);
        if (lead) lead.jumpHoldFrames = Math.min(C.JUMP_HOLD_FRAMES, lead.jumpHoldFrames + 1);
      }

      // Collision — ONLY lead horse matters for rocks
      const lead = horses.find(h => h.isLead && !h.dead);
      if (lead) {
        const lbounds = lead.getBounds();
        for (const rb of window.TravelObstacles.getBounds()) {
          if (rectsOverlap(lbounds, rb)) {
            lead.kill();
            // Promote next horse as lead
            _promoteLead();
            break;
          }
        }
      }

      // Apple collection — lead horse only
      const newLead = horses.find(h => h.isLead && !h.dead);
      if (newLead) {
        window.TravelApples.checkCollision(newLead);
      }

      // Checkpoint
      const cpHit = window.TravelCheckpoints.check(score, window.TravelApples.getPending());
      if (cpHit) {
        window.TravelApples.clearPending();
      }
    }

    if (allDead && !gameOver) {
      // Cash in any remaining apples on run end
      const pending = window.TravelApples.getPending();
      if (pending > 0) {
        window.TravelCheckpoints.check(window.TravelCheckpoints.getNextCheckpointAt(), pending);
        window.TravelApples.clearPending();
      }
      gameOver = true;
    }

    // Draw
    window.TravelBackground.draw(ctx, canvas, frameCount, gameSpeed);
    window.TravelObstacles.draw(ctx);
    window.TravelApples.draw(ctx);
    horses.forEach(h => h.draw(ctx));

    // HUD
    const herdName = window.HorseManager?.getActiveHerd()?.meta?.herd_name || '';
    window.TravelHUD.draw(ctx, canvas, {
      score,
      gameSpeed,
      horses,
      pendingApples: window.TravelApples.getPending(),
      checkpointNumber: window.TravelCheckpoints.getNumber(),
      biomeLabel: herdName,
    });

    // Checkpoint progress bar
    window.TravelCheckpoints.drawProgressBar(ctx, canvas, score);

    // Checkpoint fanfare
    window.TravelCheckpoints.draw(ctx, canvas);

    // Game over overlay
    if (gameOver && horses.every(h => h.deathTimer > 35)) {
      window.TravelHUD.drawGameOver(ctx, canvas, score, window.TravelCheckpoints.getTotalCashed());
    }
  }

  // Promote the next non-dead horse to lead
  function _promoteLead() {
    const nextLead = horses.find(h => !h.dead && !h.isLead);
    if (nextLead) {
      nextLead.isLead = true;
      console.log(`👑 ${nextLead.name} is now the lead horse`);
    }
  }

  // ---- Mount / Unmount ----
  function mount(parentEl, biomeId) {
    container = parentEl;
    currentBiomeId = biomeId || 'plains';

    // Clean up
    const existing = container.querySelector('canvas');
    if (existing) existing.remove();
    const tip = container.querySelector('p');
    if (tip) tip.remove();

    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.cssText = `
      width: 100%;
      max-width: 800px;
      display: block;
      border: 2px solid rgba(0,255,255,0.25);
      border-radius: 12px;
      cursor: pointer;
      background: #4a90d9;
    `;
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    const tip2 = document.createElement('p');
    tip2.style.cssText = 'color:#888;font-size:0.82em;margin:7px 0 0;text-align:center;';
    tip2.textContent = 'Hold SPACE for a bigger jump. Lead horse (👑) must clear rocks — followers tag along!';
    container.appendChild(tip2);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup',   handleKeyUp);
    canvas.addEventListener('click', handleTap);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(); }, { passive: false });

    startGame();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    gameLoop();
  }

  function unmount() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = null;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup',   handleKeyUp);
    if (container) container.innerHTML = '';
  }

  return { mount, unmount };
})();

window.TravelGame = TravelGame;
console.log('✅ travel.js loaded');