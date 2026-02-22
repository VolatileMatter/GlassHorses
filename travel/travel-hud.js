// === TRAVEL HUD ===

const TravelHUD = (() => {

  function draw(ctx, canvas, state) {
    const { score, gameSpeed, horses, pendingApples, biomeLabel } = state;

    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, 28);

    ctx.fillStyle  = '#fff';
    ctx.font       = 'bold 14px monospace';
    ctx.textAlign  = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 19);
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 118, 19);

    const alive = horses.filter(h => !h.dead).length;
    ctx.fillText(`🐴 ${alive}/${horses.length}`, 224, 19);

    ctx.fillStyle = '#ff9966';
    ctx.fillText(`🍎 ×${pendingApples}`, 300, 19);

    if (biomeLabel) {
      ctx.fillStyle  = '#aaffcc';
      ctx.font       = '11px monospace';
      ctx.textAlign  = 'center';
      ctx.fillText(biomeLabel, canvas.width / 2, 19);
    }

    ctx.fillStyle  = 'rgba(255,255,255,0.5)';
    ctx.font       = '11px monospace';
    ctx.textAlign  = 'right';
    ctx.fillText('Hold SPACE = bigger jump', canvas.width - 10, 19);
    ctx.textAlign  = 'left';

    // Jump charge bar (bottom-left, only when holding)
    const lead = horses.find(h => h.isLead && !h.dead);
    if (lead && lead.jumpHeld) {
      _drawChargeBar(ctx, canvas, lead.chargeRatio);
    }
  }

  function _drawChargeBar(ctx, canvas, ratio) {
    const bx = 10, by = canvas.height - 26, bw = 160, bh = 13;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#44aaff');
    grad.addColorStop(0.6, '#88eeff');
    grad.addColorStop(1, '#fffb40');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * ratio, bh);

    ctx.fillStyle  = 'rgba(255,255,255,0.8)';
    ctx.font       = '9px monospace';
    ctx.textAlign  = 'left';
    ctx.fillText('JUMP POWER', bx + 3, by + bh - 2);
  }

  function drawGameOver(ctx, canvas, score, totalCashedApples) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle   = '#ff4444';
    ctx.font        = 'bold 36px monospace';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 14;
    ctx.fillText('ALL HORSES DOWN', canvas.width / 2, canvas.height / 2 - 44);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font      = '21px monospace';
    ctx.fillText(`Distance: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 2);

    ctx.fillStyle = '#ff9966';
    ctx.font      = '17px monospace';
    ctx.fillText(`🍎 ${totalCashedApples} apples earned this run`, canvas.width / 2, canvas.height / 2 + 34);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font      = '14px monospace';
    ctx.fillText('Press SPACE or tap to travel again', canvas.width / 2, canvas.height / 2 + 66);
    ctx.textAlign = 'left';
  }

  return { draw, drawGameOver };
})();

window.TravelHUD = TravelHUD;
console.log('✅ travel-hud.js loaded');