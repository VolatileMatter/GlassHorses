// === TRAVEL MODE — Orchestrator ===
// Wires together: TravelConstants, TravelBackground, TravelHorse,
//                 TravelObstacles, TravelApples, TravelCheckpoints, TravelHUD

const TravelGame = (() => {

  let canvas, ctx, container;
  let horses        = [];
  let gameSpeed     = 0;
  let frameCount    = 0;
  let score         = 0;
  let animFrameId   = null;
  let gameOver      = false;
  let currentBiome  = 'plains';
  let spaceHeld     = false;

  // ---- Utility ----
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---- Build horse list ----
  function buildHorses() {
    const source = (window.HorseManager && window.HorseManager.getHorses().length > 0)
      ? window.HorseManager.getHorses()
      : [
          { id: 'f1', barn_name: 'Shadowmere', color: '#3a2a1a' },
          { id: 'f2', barn_name: 'Blaze',      color: '#c0602a' },
          { id: 'f3', barn_name: 'Snowflake',  color: '#d4d0c8' },
        ];

    const eligible = source.filter(h => !h.travelExhausted);
    const pool     = eligible.length > 0 ? eligible : source;

    const TC      = window.TravelConstants;
    const leadX   = TC.LEAD_X   || 200;  // ~25% of 800px canvas
    const spacing = TC.HORSE_SPACING || 22;
    horses = pool.map((h, i) =>
      new window.TravelHorse.Horse(h, leadX - i * spacing, i === 0)
    );
  }

  // ---- Start / restart ----
  function startGame() {
    const TC = window.TravelConstants;
    frameCount = 0;
    score      = 0;
    gameSpeed  = TC.SPEED_INITIAL;
    gameOver   = false;
    spaceHeld  = false;

    window.TravelBackground.init(currentBiome);
    window.TravelObstacles.reset(currentBiome);
    window.TravelApples.reset();
    window.TravelCheckpoints.reset();
    buildHorses();
  }

  // ---- Input ----
  function onKeyDown(e) {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    if (gameOver) { startGame(); return; }
    if (!spaceHeld) {
      spaceHeld = true;
      const lead = _getLead();
      if (lead) {
        lead.startJump();
        // Schedule follower ripple immediately on keydown
        horses.forEach((h, i) => {
          if (!h.isLead && !h.dead) h.scheduleFollowerJump(null, i * 70);
        });
      }
    }
  }

  function onKeyUp(e) {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    if (!spaceHeld) return;
    spaceHeld = false;
    const lead = _getLead();
    if (lead) lead.releaseJump();
  }

  function onTap() {
    if (gameOver) { startGame(); return; }
    const lead = _getLead();
    if (lead) {
      lead.startJump();
      horses.forEach((h, i) => {
        if (!h.isLead && !h.dead) h.scheduleFollowerJump(null, i * 70);
      });
      // For tap: release immediately so it's a short hop
      setTimeout(() => { if (lead) lead.releaseJump(); }, 80);
    }
  }

  function _getLead() {
    return horses.find(h => h.isLead && !h.dead) || null;
  }

  // _fireJump removed — jump fires on keydown, release just ends hold

  function _promoteLead() {
    const next = horses.find(h => !h.dead && !h.isLead);
    if (next) { next.isLead = true; console.log(`👑 ${next.name} now leads`); }
  }

  // ---- Game loop ----
  function gameLoop() {
    animFrameId = requestAnimationFrame(gameLoop);

    // Guard: if modules vanished somehow, just draw black and wait
    if (!window.TravelConstants || !window.TravelBackground) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    const TC     = window.TravelConstants;
    const allDead = horses.length > 0 && horses.every(h => h.dead);

    if (!allDead && !gameOver) {
      const terrainMult = (TC.TERRAIN_SPEED && TC.TERRAIN_SPEED[currentBiome]) || 1.0;
      gameSpeed = Math.min(TC.SPEED_MAX, (TC.SPEED_INITIAL + frameCount * TC.SPEED_INCREMENT) * terrainMult);
      score    += gameSpeed * 0.045;

      window.TravelBackground.update(gameSpeed);
      window.TravelObstacles.update(canvas.width, gameSpeed);
      window.TravelApples.update(canvas.width, gameSpeed);
      horses.forEach(h => h.update());

      // Hold state is managed inside Horse.update() via jumpHeld flag

      // Collision: only lead horse vs rocks
      const lead = _getLead();
      if (lead) {
        const lb = lead.getBounds();
        for (const rb of window.TravelObstacles.getBounds()) {
          if (rectsOverlap(lb, rb)) {
            lead.kill();
            _promoteLead();
            break;
          }
        }
      }

      // Apple collection
      const newLead = _getLead();
      if (newLead) window.TravelApples.checkCollision(newLead);

      // Checkpoint
      if (window.TravelCheckpoints.check(score, window.TravelApples.getPending())) {
        window.TravelApples.clearPending();
      }
    }

    if (allDead && !gameOver) {
      // Cash remaining apples on run end
      const pending = window.TravelApples.getPending();
      if (pending > 0) {
        window.TravelCheckpoints.check(window.TravelCheckpoints.getNextCheckpointAt(), pending);
        window.TravelApples.clearPending();
      }
      gameOver = true;
    }

    // Draw everything
    window.TravelBackground.draw(ctx, canvas, frameCount, gameSpeed);
    window.TravelObstacles.draw(ctx);
    window.TravelApples.draw(ctx);
    horses.forEach(h => h.draw(ctx));

    // HUD
    window.TravelHUD.draw(ctx, canvas, {
      score,
      gameSpeed,
      horses,
      pendingApples: window.TravelApples.getPending(),
      biomeLabel: window.HorseManager?.getActiveHerd()?.meta?.herd_name || '',
    });

    window.TravelCheckpoints.drawProgressBar(ctx, canvas, score);
    window.TravelCheckpoints.draw(ctx, canvas);

    if (gameOver && horses.every(h => h.deathTimer > 35)) {
      window.TravelHUD.drawGameOver(ctx, canvas, score, window.TravelCheckpoints.getTotalCashed());
    }
  }

  // ---- Mount / Unmount ----
  function mount(parentEl, biomeId) {
    container    = parentEl;
    currentBiome = biomeId || 'plains';

    // Clean old DOM
    Array.from(container.querySelectorAll('canvas, p')).forEach(el => el.remove());

    canvas = document.createElement('canvas');
    canvas.width  = 800;
    canvas.height = 400;
    canvas.style.cssText = [
      'width:100%',
      'max-width:800px',
      'display:block',
      'border:2px solid rgba(0,255,255,0.25)',
      'border-radius:12px',
      'cursor:pointer',
    ].join(';');
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    const tip = document.createElement('p');
    tip.style.cssText = 'color:#888;font-size:0.82em;margin:7px 0 0;text-align:center;';
    tip.textContent   = 'Hold SPACE for a bigger jump — 👑 lead horse must clear rocks!';
    container.appendChild(tip);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    canvas.addEventListener('click', onTap);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); onTap(); }, { passive: false });

    if (animFrameId) cancelAnimationFrame(animFrameId);
    startGame();
    gameLoop();
  }

  function unmount() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    if (container) container.innerHTML = '';
  }

  return { mount, unmount };
})();

window.TravelGame = TravelGame;
console.log('✅ travel.js loaded');