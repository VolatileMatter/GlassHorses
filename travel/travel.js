// === TRAVEL MODE — Orchestrator ===

const TravelGame = (() => {

  let canvas, ctx, container;
  let horses        = [];
  let gameSpeed     = 0;
  let frameCount    = 0;
  let score         = 0;        // metres
  let tiles         = 0;        // current tile = Math.floor(score / METRES_PER_TILE)
  let nextTerrainAt = 0;        // tile count at which to swap terrain
  let animFrameId   = null;
  let gameOver      = false;
  let paused        = false;
  let currentBiome  = 'plains';
  let inputHeld     = false;

  // Terrain rotation: brown=plains, green=forest, grey=desert
  const TERRAIN_CYCLE = ['plains', 'forest', 'desert'];

  function _pickNextTerrain() {
    const TC     = window.TravelConstants;
    const min    = TC?.TERRAIN_SWAP_MIN_TILES || 50;
    const max    = TC?.TERRAIN_SWAP_MAX_TILES || 200;
    const span   = Math.floor(min + Math.random() * (max - min));
    nextTerrainAt = tiles + span;
    console.log(`🌍 next terrain swap at tile ${nextTerrainAt}`);
  }

  function _switchTerrain() {
    // Pick a different biome from the current one
    const others  = TERRAIN_CYCLE.filter(b => b !== currentBiome);
    currentBiome  = others[Math.floor(Math.random() * others.length)];
    window.TravelBackground.init(currentBiome);
    window.TravelObstacles.reset(currentBiome);
    console.log(`🌍 terrain → ${currentBiome}`);
    _pickNextTerrain();
  }

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
    const leadX   = TC.LEAD_X       || 200;
    const spacing = TC.HORSE_SPACING || 52;
    horses = pool.map((h, i) =>
      new window.TravelHorse.Horse(h, leadX - i * spacing, i === 0)
    );
  }

  // ---- Start / restart ----
  function startGame() {
    const TC = window.TravelConstants;
    frameCount    = 0;
    score         = 0;
    tiles         = 0;
    gameSpeed     = TC.SPEED_INITIAL;
    gameOver      = false;
    paused        = false;
    inputHeld     = false;

    window.TravelBackground.init(currentBiome);
    window.TravelObstacles.reset(currentBiome);
    window.TravelApples.reset();
    window.TravelCheckpoints.reset();
    buildHorses();
    _pickNextTerrain();
  }

  // ---- Pause ----
  function _pause() {
    if (paused || gameOver) return;
    paused    = true;
    inputHeld = false;
    const lead = _getLead();
    if (lead) lead.releaseJump();
  }

  function _resume() {
    if (!paused) return;
    paused = false;
  }

  // ---- Shared jump trigger ----
  function _triggerJump() {
    if (inputHeld || paused) return;
    inputHeld = true;
    const lead = _getLead();
    if (!lead) return;
    lead.startJump();

    // Calculate per-follower delay: each horse is (i * spacing) pixels behind the lead.
    // The rock that the lead just jumped over will reach follower i in:
    //   delay_frames = (i * spacing) / gameSpeed
    // This ensures each horse jumps at exactly the right moment regardless of speed.
    const TC      = window.TravelConstants;
    const spacing = TC.HORSE_SPACING || 52;
    let followerIndex = 0;
    horses.forEach((h) => {
      if (h.isLead || h.dead) return;
      followerIndex++;
      const pixelsBack  = followerIndex * spacing;
      const delayFrames = Math.round(pixelsBack / gameSpeed);
      h.scheduleFollowerJump(null, delayFrames);
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
    if (paused)   { _resume(); return; }
    _triggerJump();
  }

  function onKeyUp(e) {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    _releaseJump();
  }

  // ---- Mouse input — canvas clicks resume/jump, clicks outside pause ----
  function onCanvasMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    if (gameOver) { startGame(); return; }
    if (paused)   { _resume(); return; }
    _triggerJump();
  }

  function onCanvasMouseUp(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    _releaseJump();
  }

  // Clicking outside the canvas (anywhere in the document) pauses
  function onDocumentMouseDown(e) {
    if (!canvas) return;
    if (e.target === canvas) return;      // canvas handles its own clicks
    if (gameOver || paused) return;
    _pause();
  }

  // Window blur (alt-tab, etc.) also pauses
  function onWindowBlur() {
    _pause();
  }

  // ---- Touch ----
  function onTouchStart(e) {
    e.preventDefault();
    if (gameOver) { startGame(); return; }
    if (paused)   { _resume(); return; }
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

  // ---- Pause overlay ----
  function _drawPauseOverlay() {
    const w = canvas.width, h = canvas.height;
    // Dim the scene
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);

    // Panel
    const pw = 320, ph = 110;
    const px = (w - pw) / 2, py = (h - ph) / 2;
    ctx.fillStyle = 'rgba(10,10,20,0.92)';
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,220,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // PAUSED text
    ctx.fillStyle   = '#00eeff';
    ctx.font        = 'bold 36px monospace';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#00eeff';
    ctx.shadowBlur  = 18;
    ctx.fillText('PAUSED', w / 2, py + 54);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font      = '14px monospace';
    ctx.fillText('Click or press SPACE to resume', w / 2, py + 85);
    ctx.textAlign = 'left';
  }

  // ---- Game loop ----
  function gameLoop() {
    animFrameId = requestAnimationFrame(gameLoop);

    if (!window.TravelConstants || !window.TravelBackground) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Always draw the current scene underneath
    window.TravelBackground.draw(ctx, canvas, frameCount, gameSpeed);
    window.TravelObstacles.draw(ctx);
    window.TravelApples.draw(ctx);
    horses.forEach(h => h.draw(ctx));
    window.TravelHUD.draw(ctx, canvas, {
      score,
      tiles,
      gameSpeed,
      horses,
      pendingApples: window.TravelApples.getPending(),
      biomeLabel: window.HorseManager?.getActiveHerd()?.meta?.herd_name || '',
    });
    window.TravelCheckpoints.drawProgressBar(ctx, canvas, score);
    window.TravelCheckpoints.draw(ctx, canvas);

    // If paused: overlay and stop updating
    if (paused) {
      _drawPauseOverlay();
      return;
    }

    frameCount++;

    const TC      = window.TravelConstants;
    const allDead = horses.length > 0 && horses.every(h => h.dead);

    if (!allDead && !gameOver) {
      const terrainMult = (TC.TERRAIN_SPEED && TC.TERRAIN_SPEED[currentBiome]) || 1.0;
      gameSpeed = Math.min(TC.SPEED_MAX, (TC.SPEED_INITIAL + frameCount * TC.SPEED_INCREMENT) * terrainMult);

      const scoreScale  = TC.SCORE_SCALE      || 0.01543;
      const mPerTile    = TC.METRES_PER_TILE  || 10;
      score += gameSpeed * scoreScale;
      const newTiles = Math.floor(score / mPerTile);
      if (newTiles > tiles) {
        tiles = newTiles;
        if (tiles >= nextTerrainAt) _switchTerrain();
      }

      window.TravelBackground.update(gameSpeed);
      window.TravelObstacles.update(canvas.width, gameSpeed);
      window.TravelApples.update(canvas.width, gameSpeed);
      horses.forEach(h => h.update());

      // Collision: lead horse vs rocks
      const lead = _getLead();
      if (lead) {
        const lb = lead.getBounds();
        if (lb) {
          for (const rb of window.TravelObstacles.getBounds()) {
            if (rectsOverlap(lb, rb)) {
              lead.kill();
              _promoteLead();
              // Grace: give all surviving followers 10 frames of immunity
              horses.forEach(h => {
                if (!h.dead) h.immunityFrames = 120; // 2 seconds at 60fps
              });
              break;
            }
          }
        }
      }

      const newLead = _getLead();
      if (newLead) window.TravelApples.checkCollision(newLead);

      if (window.TravelCheckpoints.check(score, window.TravelApples.getPending())) {
        window.TravelApples.clearPending();
      }
    }

    if (allDead && !gameOver) {
      gameOver = true;
    }

    if (gameOver && horses.every(h => h.deathTimer > 35)) {
      window.TravelHUD.drawGameOver(ctx, canvas, score,
        window.TravelCheckpoints.getTotalCashed(),
        window.TravelCheckpoints.getNumber());
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

    document.addEventListener('keydown',   onKeyDown);
    document.addEventListener('keyup',     onKeyUp);
    document.addEventListener('mousedown', onDocumentMouseDown);  // outside-click pause
    window.addEventListener('blur',        onWindowBlur);          // alt-tab pause
    canvas.addEventListener('mousedown',   onCanvasMouseDown);
    canvas.addEventListener('mouseup',     onCanvasMouseUp);
    canvas.addEventListener('mouseleave',  onCanvasMouseUp);
    canvas.addEventListener('touchstart',  onTouchStart, { passive: false });
    canvas.addEventListener('touchend',    onTouchEnd,   { passive: false });

    if (animFrameId) cancelAnimationFrame(animFrameId);
    startGame();
    gameLoop();
  }

  function unmount() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    document.removeEventListener('keydown',   onKeyDown);
    document.removeEventListener('keyup',     onKeyUp);
    document.removeEventListener('mousedown', onDocumentMouseDown);
    window.removeEventListener('blur',        onWindowBlur);
    if (container) container.innerHTML = '';
  }

  return { mount, unmount };
})();

window.TravelGame = TravelGame;
console.log('✅ travel.js loaded');