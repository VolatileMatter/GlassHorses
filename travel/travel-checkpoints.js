// === TRAVEL CHECKPOINT SYSTEM ===
// Manages checkpoint levels. At each checkpoint:
//   - Pending apples are "cashed in" to the herd's inventory
//   - A visual fanfare plays
//   - The game continues at higher speed

const TravelCheckpoints = (() => {
  const C = () => window.TravelConstants;

  let checkpointNumber = 0;      // How many checkpoints passed
  let nextCheckpointAt = 0;      // Score threshold for next checkpoint
  let fanfareTimer = 0;          // Frames of fanfare overlay remaining
  let lastCashedApples = 0;      // Apples cashed at last checkpoint
  let totalCashedApples = 0;     // Total this run (for display)

  const FANFARE_FRAMES = 120;

  function reset() {
    checkpointNumber = 0;
    nextCheckpointAt = C().CHECKPOINT_DISTANCE;
    fanfareTimer = 0;
    lastCashedApples = 0;
    totalCashedApples = 0;
  }

  function getNextCheckpointAt() { return nextCheckpointAt; }
  function getNumber() { return checkpointNumber; }
  function isFanfareActive() { return fanfareTimer > 0; }
  function getTotalCashed() { return totalCashedApples; }

  // Call every frame with current score
  // Returns true if a checkpoint was just hit
  function check(score, pendingApples) {
    if (score >= nextCheckpointAt) {
      _triggerCheckpoint(pendingApples);
      return true;
    }
    if (fanfareTimer > 0) fanfareTimer--;
    return false;
  }

  function _triggerCheckpoint(pendingApples) {
    checkpointNumber++;
    nextCheckpointAt += C().CHECKPOINT_DISTANCE * (1 + checkpointNumber * 0.2);
    fanfareTimer = FANFARE_FRAMES;
    lastCashedApples = pendingApples;
    totalCashedApples += pendingApples;

    // Commit apples to herd inventory
    _addToHerdInventory(pendingApples);

    console.log(`🏁 Checkpoint ${checkpointNumber}! Cashed ${pendingApples} apples.`);
    return true;
  }

  function _addToHerdInventory(appleCount) {
    if (!window.HorseManager || appleCount === 0) return;
    const herd = window.HorseManager.getActiveHerd();
    if (!herd) return;

    if (!herd.meta.inventory) herd.meta.inventory = {};
    herd.meta.inventory.apples = (herd.meta.inventory.apples || 0) + appleCount;

    console.log(`🍎 Herd now has ${herd.meta.inventory.apples} apples total`);
  }

  // Draw the checkpoint fanfare overlay
  function draw(ctx, canvas) {
    if (fanfareTimer <= 0) return;

    const alpha = Math.min(1, fanfareTimer / 30) * Math.min(1, (fanfareTimer / FANFARE_FRAMES) * 2.5);
    const w = canvas.width;
    const h = canvas.height;

    // Background flash
    ctx.save();
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = '#ffe840';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Banner
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.4);
    const bannerY = h * 0.35;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, bannerY - 40, w, 100);

    // Checkpoint title
    ctx.fillStyle = '#ffe840';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffe840';
    ctx.shadowBlur = 18;
    ctx.fillText(`CHECKPOINT ${checkpointNumber}`, w / 2, bannerY);
    ctx.shadowBlur = 0;

    // Apple count
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`🍎 +${lastCashedApples} apples added to herd!`, w / 2, bannerY + 36);

    ctx.restore();
    fanfareTimer--;
  }

  // Draw the HUD element showing checkpoint progress bar
  function drawProgressBar(ctx, canvas, score) {
    const C2 = C();
    const prev = nextCheckpointAt - C2.CHECKPOINT_DISTANCE * (1 + Math.max(0, checkpointNumber - 1) * 0.2);
    const range = nextCheckpointAt - prev;
    const progress = Math.min(1, (score - prev) / range);

    const bx = canvas.width - 200;
    const by = 6;
    const bw = 190;
    const bh = 10;

    // Track
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx, by, bw, bh);

    // Fill
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#4aff8a');
    grad.addColorStop(1, '#ffe840');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * progress, bh);

    // Flag icon at end
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`🏁 CP${checkpointNumber + 1}`, canvas.width - 8, by + 9);
  }

  return {
    reset, check, draw, drawProgressBar,
    getNextCheckpointAt, getNumber, isFanfareActive, getTotalCashed,
  };
})();

window.TravelCheckpoints = TravelCheckpoints;
console.log('✅ travel-checkpoints.js loaded');