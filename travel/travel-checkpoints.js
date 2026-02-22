// === TRAVEL CHECKPOINT SYSTEM ===
// Every CHECKPOINT_DISTANCE score units: cash in apples, show fanfare.

const TravelCheckpoints = (() => {
  let checkpointNumber  = 0;
  let nextCheckpointAt  = 0;
  let fanfareTimer      = 0;
  let lastCashedApples  = 0;
  let totalCashedApples = 0;
  const FANFARE_FRAMES  = 110;

  function reset() {
    const TC         = window.TravelConstants;
    checkpointNumber  = 0;
    nextCheckpointAt  = TC ? TC.CHECKPOINT_DISTANCE : 1200;
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
    const TC = window.TravelConstants;
    checkpointNumber++;
    const dist = TC ? TC.CHECKPOINT_DISTANCE : 1200;
    nextCheckpointAt += dist * (1 + checkpointNumber * 0.2);
    fanfareTimer      = FANFARE_FRAMES;
    lastCashedApples  = pendingApples;
    totalCashedApples += pendingApples;
    _addToInventory(pendingApples);
    console.log(`🏁 Checkpoint ${checkpointNumber}! +${pendingApples} apples`);
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

    ctx.fillStyle  = '#ffe840';
    ctx.font       = 'bold 34px monospace';
    ctx.textAlign  = 'center';
    ctx.shadowColor = '#ffe840'; ctx.shadowBlur = 16;
    ctx.fillText(`CHECKPOINT ${checkpointNumber}`, w / 2, by);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font      = '19px monospace';
    ctx.fillText(`🍎 +${lastCashedApples} apples added to herd!`, w / 2, by + 34);
    ctx.restore();

    fanfareTimer--;
  }

  function drawProgressBar(ctx, canvas, score) {
    const TC   = window.TravelConstants;
    const dist = TC ? TC.CHECKPOINT_DISTANCE : 1200;
    const prevCP = nextCheckpointAt - dist * (1 + Math.max(0, checkpointNumber - 1) * 0.2);
    const range  = nextCheckpointAt - prevCP;
    const progress = Math.min(1, Math.max(0, (score - prevCP) / range));

    const bx = canvas.width - 198, by = 6, bw = 188, bh = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx, by, bw, bh);

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#4aff8a');
    grad.addColorStop(1, '#ffe840');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * progress, bh);

    ctx.fillStyle = '#fff';
    ctx.font      = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`🏁 CP${checkpointNumber + 1}`, canvas.width - 8, by + 9);
    ctx.textAlign = 'left';
  }

  return { reset, check, draw, drawProgressBar, getNextCheckpointAt, getNumber, getTotalCashed };
})();

window.TravelCheckpoints = TravelCheckpoints;
console.log('✅ travel-checkpoints.js loaded');