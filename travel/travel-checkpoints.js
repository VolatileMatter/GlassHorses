// === TRAVEL CHECKPOINT SYSTEM ===
// Checkpoints every CHECKPOINT_KM kilometres (score is in metres).
// Hitting a checkpoint saves all pending apples to the herd inventory and resets pending to 0.

const TravelCheckpoints = (() => {
  let checkpointNumber  = 0;
  let nextCheckpointAt  = 0;   // metres
  let fanfareTimer      = 0;
  let lastCashedApples  = 0;
  let totalCashedApples = 0;
  const FANFARE_FRAMES  = 110;

  // Returns the checkpoint interval in metres, derived from tile constants
  function _cpDistMetres() {
    const TC = window.TravelConstants;
    const tiles   = TC?.CHECKPOINT_TILES   || 100;
    const mPerT   = TC?.METRES_PER_TILE    || 10;
    return tiles * mPerT;   // 100 tiles * 10 m = 1000 m = 1 km
  }

  function reset() {
    checkpointNumber  = 0;
    nextCheckpointAt  = _cpDistMetres();
    fanfareTimer      = 0;
    lastCashedApples  = 0;
    totalCashedApples = 0;
  }

  function getNextCheckpointAt() { return nextCheckpointAt; }
  function getNumber()           { return checkpointNumber; }
  function getTotalCashed()      { return totalCashedApples; }

  // Returns true when a checkpoint is triggered
  function check(score, pendingApples) {
    if (score >= nextCheckpointAt) {
      _trigger(pendingApples);
      return true;
    }
    if (fanfareTimer > 0) fanfareTimer--;
    return false;
  }

  function _trigger(pendingApples) {
    checkpointNumber++;
    nextCheckpointAt += _cpDistMetres();   // every 100 tiles, evenly spaced
    fanfareTimer      = FANFARE_FRAMES;
    lastCashedApples  = pendingApples;
    totalCashedApples += pendingApples;
    _addToInventory(pendingApples);
    console.log(`🏁 Checkpoint ${checkpointNumber} (${checkpointNumber}km)! +${pendingApples} apples saved`);
  }

  function _addToInventory(count) {
    if (!window.HorseManager || count === 0) return;
    const herd = window.HorseManager.getActiveHerd();
    if (!herd) return;
    if (!herd.meta.inventory) herd.meta.inventory = {};
    herd.meta.inventory.apples = (herd.meta.inventory.apples || 0) + count;
  }

  function draw(ctx, canvas) {
    if (fanfareTimer <= 0) return;
    const alpha = Math.min(1, fanfareTimer / 25) * Math.min(1, (fanfareTimer / FANFARE_FRAMES) * 3);
    const w = canvas.width, h = canvas.height;

    ctx.save();
    ctx.globalAlpha = alpha * 0.38;
    ctx.fillStyle   = '#ffe840';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.3);
    const by = h * 0.36;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, by - 38, w, 90);

    ctx.fillStyle   = '#ffe840';
    ctx.font        = 'bold 34px monospace';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#ffe840'; ctx.shadowBlur = 16;
    ctx.fillText(`${checkpointNumber}km CHECKPOINT`, w / 2, by);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font      = '19px monospace';
    ctx.fillText(`🍎 +${lastCashedApples} apples saved to herd!`, w / 2, by + 34);
    ctx.restore();

    fanfareTimer--;
  }

  return { reset, check, draw, getNextCheckpointAt, getNumber, getTotalCashed };
})();

window.TravelCheckpoints = TravelCheckpoints;
console.log('✅ travel-checkpoints.js loaded');