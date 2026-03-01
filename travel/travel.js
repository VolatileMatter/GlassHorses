// === TRAVEL MODE — Orchestrator ===
// Wires together: TravelConstants, TravelBackground, TravelHorse,
//                 TravelObstacles, TravelApples, TravelCheckpoints, TravelHUD

const TravelGame = (() => {

  let canvas, ctx, container;
  let horses        = [];
  let gameSpeed     = 0;
  let frameCount    = 0;
  let score         = 0;        // metres travelled
  let animFrameId   = null;
  let gameOver      = false;
  let currentBiome  = 'plains';
  let inputHeld     = false;    // true while space OR mouse button is held

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
    const leadX   = TC.LEAD_X      || 200;
    const spacing = TC.HORSE_SPACING || 52;
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
    inputHeld  = false;

    window.TravelBackground.init(currentBiome);
    window.TravelObstacles.reset(currentBiome);
    window.TravelApples.reset();
    window.TravelCheckpoints.reset();
    buildHorses();
  }

  // ---- Shared jump trigger ----
  function _triggerJump() {
    if (inputHeld) return;   // already held, don't re-trigger
    inputHeld = true;
    const lead = _getLead();
    if (!lead) return;
    lead.startJump();
    // Ripple: followers jump at 30-frame intervals (tight enough to all clear obstacles)
    horses.forEach((h, i) => {
      if (!h.isLead && !h.dead) h.scheduleFollowerJump(null, i * 30);
    });
  }

  function _releaseJump() {
    if (!inputHeld) return;
    inputHeld = false;
    const lead = _getLead();
    if (lead) lead.releaseJump();
  }

  // ---- Keyboard input ----
  function onKeyDown(e) {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    if (gameOver) { startGame(); return; }
    _triggerJump();
  }

  function onKeyUp(e) {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    _releaseJump();
  }

  // ---- Mouse input (LMB identical to Space) ----
  function onMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    if (gameOver) { startGame(); return; }
    _triggerJump();
  }

  function onMouseUp(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    _releaseJump();
  }

  // ---- Touch input ----
  function onTouchStart(e) {
    e.preventDefault();
    if (gameOver) { startGame(); return; }
    _triggerJump();
  }

  function onTouchEnd(e) {
    e.preventDefault();
    _releaseJump();
  }

  function _getLead() {
    return horses.find(h => h.isLead && !h.dead) || null;
  }

  function _promoteLead() {
    const next = horses.find(h => !h.dead && !h.isLead);
    if (next) { next.isLead = true; console.log(`👑 ${next.name} now leads`); }
  }

  // ---- Game loop ----
  function gameLoop() {
    animFrameId = requestAnimationFrame(gameLoop);

    if (!window.TravelConstants || !window.TravelBackground) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    const TC      = window.TravelConstants;
    const allDead = horses.length > 0 && horses.every(h => h.dead);

    if (!allDead && !gameOver) {
      const terrainMult = (TC.TERRAIN_SPEED && TC.TERRAIN_SPEED[currentBiome]) || 1.0;
      gameSpeed = Math.min(TC.SPEED_MAX, (TC.SPEED_INITIAL + frameCount * TC.SPEED_INCREMENT) * terrainMult);

      // Score in metres: scale factor converts px/frame → metres/frame
      const scoreScale = TC.SCORE_SCALE || 0.01543;
      score += gameSpeed * scoreScale;

      window.TravelBackground.update(gameSpeed);
      window.TravelObstacles.update(canvas.width, gameSpeed);
      window.TravelApples.update(canvas.width, gameSpeed);
      horses.forEach(h => h.update());

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

      // Checkpoint check (score is in metres; checkpoints every CHECKPOINT_KM * 1000)
      if (window.TravelCheckpoints.check(score, window.TravelApples.getPending())) {
        window.TravelApples.clearPending();
      }
    }

    if (allDead && !gameOver) {
      // Cash remaining apples on run end (no checkpoint save — apples lost on death)
      gameOver = true;
    }

    // Draw
    window.TravelBackground.draw(ctx, canvas, frameCount, gameSpeed);
    window.TravelObstacles.draw(ctx);
    window.TravelApples.draw(ctx);
    horses.forEach(h => h.draw(ctx));

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
      'user-select:none',
    ].join(';');
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    const tip = document.createElement('p');
    tip.style.cssText = 'color:#888;font-size:0.82em;margin:7px 0 0;text-align:center;';
    tip.textContent   = 'Hold SPACE or click — 👑 lead horse must clear rocks!';
    container.appendChild(tip);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    canvas.addEventListener('mousedown',  onMouseDown);
    canvas.addEventListener('mouseup',    onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);          // release if cursor leaves
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });

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