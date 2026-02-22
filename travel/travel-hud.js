// === TRAVEL HUD ===
// Draws the heads-up display: score, speed, horses, apple count, checkpoint bar.

const TravelHUD = (() => {

  function draw(ctx, canvas, state) {
    const { score, gameSpeed, horses, pendingApples, checkpointNumber, biomeLabel } = state;

    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, 28);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';

    // Score
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 19);

    // Speed
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 120, 19);

    // Horses alive
    const alive = horses.filter(h => !h.dead).length;
    const total = horses.length;
    ctx.fillText(`🐴 ${alive}/${total}`, 230, 19);

    // Apples (pending)
    ctx.fillStyle = '#ff6666';
    ctx.fillText(`🍎 ×${pendingApples}`, 310, 19);

    // Biome name
    if (biomeLabel) {
      ctx.fillStyle = '#aaffcc';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(biomeLabel, canvas.width / 2, 19);
    }

    // Controls hint
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Hold SPACE = bigger jump', canvas.width - 10, 19);

    // Lead horse charge bar (bottom-left)
    const lead = horses.find(h => h.isLead && !h.dead);
    if (lead && lead.jumpHeld) {
      _drawChargeBar(ctx, canvas, lead.chargeRatio);
    }

    // Checkpoint progress bar (top-right inside bar)
    // Drawn by TravelCheckpoints.drawProgressBar separately

    ctx.textAlign = 'left';
  }

  function _drawChargeBar(ctx, canvas, ratio) {
    const bx = 10;
    const by = canvas.height - 24;
    const bw = 160;
    const bh = 12;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#44aaff');
    grad.addColorStop(0.6, '#88eeff');
    grad.addColorStop(1, '#fffb40');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * ratio, bh);

    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('JUMP POWER', bx + 2, by + bh - 2);
  }

  function drawGameOver(ctx, canvas, score, totalCashedApples) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 38px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 16;
    ctx.fillText('ALL HORSES DOWN', canvas.width / 2, canvas.height / 2 - 45);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    ctx.fillText(`Distance: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#ff9955';
    ctx.font = '18px monospace';
    ctx.fillText(`🍎 ${totalCashedApples} apples added to herd`, canvas.width / 2, canvas.height / 2 + 34);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '15px monospace';
    ctx.fillText('Press SPACE or tap to travel again', canvas.width / 2, canvas.height / 2 + 70);
    ctx.textAlign = 'left';
  }

  return { draw, drawGameOver };
})();

window.TravelHUD = TravelHUD;
console.log('✅ travel-hud.js loaded');