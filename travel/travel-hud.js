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
    ctx.fillText(`Dist: ${(score/1000).toFixed(2)}km`, 10, 19);
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
    ctx.fillText('Hold SPACE = float down', canvas.width - 10, 19);
    ctx.textAlign  = 'left';

    // Jump float bar — visible while lead is airborne (ascending or slow-falling)
    const lead = horses.find(h => h.isLead && !h.dead);
    if (lead && !lead.onGround) {
      const TC = window.TravelConstants;
      const isAscending  = lead.vy < 0;
      const isSlowFall   = lead.jumpHeld && lead.holdFrames < (TC?.MAX_HOLD_FRAMES || 28);
      if (isAscending || isSlowFall) {
        // remaining = 1.0 while ascending; drains during slow-fall
        const remaining = isAscending
          ? 1.0
          : 1 - Math.min(1, lead.holdFrames / (TC?.MAX_HOLD_FRAMES || 28));
        _drawFloatBar(ctx, canvas, remaining, isAscending);
      }
    }
  }

  function _drawFloatBar(ctx, canvas, remaining, isAscending) {
    const bx = 10, by = canvas.height - 26, bw = 160, bh = 13;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    if (isAscending) {
      // Bright solid while rising
      grad.addColorStop(0, '#44ddff');
      grad.addColorStop(1, '#aaffee');
    } else {
      // Drains yellow→orange as slow-fall runs out
      grad.addColorStop(0,   '#44aaff');
      grad.addColorStop(0.5, '#88eeff');
      grad.addColorStop(1,   '#fffb40');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * remaining, bh);

    ctx.fillStyle  = 'rgba(255,255,255,0.8)';
    ctx.font       = '9px monospace';
    ctx.textAlign  = 'left';
    ctx.fillText(isAscending ? 'RISING' : 'HOLD TO FLOAT', bx + 3, by + bh - 2);
  }

  function drawGameOver(ctx, canvas, score, totalCashedApples, lastCheckpointKm) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle   = '#ff4444';
    ctx.font        = 'bold 30px monospace';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 14;
    ctx.fillText('ALL HORSES DOWN', w / 2, h * 0.20);
    ctx.shadowBlur  = 0;

    // Summary panel
    const pw = 460, ph = 180;
    const px = (w - pw) / 2, py = h * 0.27;
    ctx.fillStyle = 'rgba(15,15,30,0.95)';
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Panel header
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font      = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RUN SUMMARY', w / 2, py + 20);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 28); ctx.lineTo(px + pw - 20, py + 28);
    ctx.stroke();

    // Stats
    const col1 = px + pw * 0.28, col2 = px + pw * 0.72;
    const row1 = py + 62, row2 = py + 118;

    _drawStat(ctx, col1, row1, 'DISTANCE', `${(score / 1000).toFixed(2)} km`);
    _drawStat(ctx, col2, row1, 'LAST CHECKPOINT', lastCheckpointKm > 0 ? `${lastCheckpointKm} km` : 'none');
    _drawStat(ctx, col1, row2, 'APPLES SAVED', `🍎 ${totalCashedApples}`);
    _drawStat(ctx, col2, row2, 'UNSAVED APPLES', totalCashedApples === 0 && score > 0 ? '💨 lost' : '(at checkpoint)');

    // Restart hint
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font      = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE or click to ride again', w / 2, py + ph + 28);
    ctx.textAlign = 'left';
  }

  function _drawStat(ctx, cx, cy, label, value) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy - 14);

    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 18px monospace';
    ctx.fillText(value, cx, cy + 6);
  }

  return { draw, drawGameOver };
})();

window.TravelHUD = TravelHUD;
console.log('✅ travel-hud.js loaded');