// === TRAVEL BACKGROUND / PARALLAX RENDERER ===

const TravelBackground = (() => {
  let layerOffsets = [];
  let cloudOffsets = [];
  let currentBiome = null;

  function init(biomeId) {
    const TC = window.TravelConstants;
    if (!TC) { console.error('TravelBackground: TravelConstants missing'); return; }
    currentBiome = TC.BIOMES[biomeId] || TC.BIOMES.plains;
    layerOffsets = currentBiome.parallax.map(() => 0);
    cloudOffsets = currentBiome.clouds.map(c => ({ ...c, ox: 0 }));
    console.log('TravelBackground init:', currentBiome.name);
  }

  function update(gameSpeed) {
    if (!currentBiome) return;
    currentBiome.parallax.forEach((layer, i) => {
      layerOffsets[i] = (layerOffsets[i] + gameSpeed * layer.speed) % 900;
    });
    cloudOffsets.forEach(c => {
      c.ox = (c.ox + gameSpeed * 0.18) % 950;
    });
  }

  function draw(ctx, canvas, frameCount, gameSpeed) {
    const TC = window.TravelConstants;
    if (!TC) return;
    const GROUND_Y = TC.GROUND_Y;
    const w = canvas.width;
    const h = canvas.height;

    // Fallback sky if init didn't run
    if (!currentBiome) {
      ctx.fillStyle = '#4a90d9';
      ctx.fillRect(0, 0, w, GROUND_Y);
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);
      return;
    }

    const b = currentBiome;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, b.sky.top);
    skyGrad.addColorStop(1, b.sky.bottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, GROUND_Y);

    // Parallax layers back→front
    currentBiome.parallax.forEach((layer, i) => {
      _drawLayer(ctx, w, h, GROUND_Y, layer, layerOffsets[i] || 0);
    });

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    cloudOffsets.forEach(c => {
      const cx = ((c.x + c.ox) % (w + 120)) - 60;
      _drawCloud(ctx, cx, c.y, c.size);
    });

    // Ground
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, h);
    groundGrad.addColorStop(0, b.ground.top);
    groundGrad.addColorStop(0.3, b.ground.mid);
    groundGrad.addColorStop(1, b.ground.bot);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);

    // Ground strip
    ctx.fillStyle = b.ground.strip;
    ctx.fillRect(0, GROUND_Y, w, 5);

    // Dust streaks
    ctx.strokeStyle = b.dustColor;
    ctx.lineWidth = 1;
    for (let di = 0; di < 6; di++) {
      const px = ((frameCount * gameSpeed * (0.4 + di * 0.18)) % (w + 50)) - 25;
      const py = GROUND_Y + 8 + di * 11;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 22, py);
      ctx.stroke();
    }
  }

  function _drawLayer(ctx, w, h, GROUND_Y, layer, offset) {
    ctx.save();
    const type = layer.type;
    const y0 = GROUND_Y * layer.yBase;

    if (type === 'mountains') {
      ctx.fillStyle = layer.color;
      for (let x = -(offset % 180) - 180; x < w + 200; x += 180) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 30, y0 - 60);
        ctx.lineTo(x + 90, y0 - 100);
        ctx.lineTo(x + 150, y0 - 55);
        ctx.lineTo(x + 180, GROUND_Y);
        ctx.fill();
      }

    } else if (type === 'hills' || type === 'dunes_far' || type === 'dunes_mid') {
      const step = 120;
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(-(offset % step) - step, GROUND_Y);
      for (let x = -(offset % step) - step; x < w + step * 2; x += step) {
        ctx.bezierCurveTo(x + step * 0.25, y0 * 0.92, x + step * 0.75, y0 * 1.08, x + step, y0);
      }
      ctx.lineTo(w + step * 2, GROUND_Y);
      ctx.closePath();
      ctx.fill();

    } else if (type === 'trees' || type === 'trees_far' || type === 'trees_mid') {
      const spacing = type === 'trees_far' ? 90 : type === 'trees_mid' ? 60 : 75;
      const treeH   = type === 'trees_far' ? 50 : type === 'trees_mid' ? 70 : 60;
      const treeW   = spacing * 0.55;
      ctx.fillStyle = layer.color;
      for (let x = -(offset % spacing) - spacing; x < w + spacing; x += spacing) {
        // Trunk
        ctx.fillRect(x + treeW * 0.4, GROUND_Y - treeH * 0.3, treeW * 0.2, treeH * 0.35);
        // Lower canopy
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - treeH * 0.25);
        ctx.lineTo(x + treeW * 0.5, GROUND_Y - treeH);
        ctx.lineTo(x + treeW, GROUND_Y - treeH * 0.25);
        ctx.fill();
        // Upper canopy
        ctx.beginPath();
        ctx.moveTo(x + treeW * 0.1, GROUND_Y - treeH * 0.45);
        ctx.lineTo(x + treeW * 0.5, GROUND_Y - treeH * 1.15);
        ctx.lineTo(x + treeW * 0.9, GROUND_Y - treeH * 0.45);
        ctx.fill();
      }

    } else if (type === 'cacti') {
      const spacing = 140;
      ctx.fillStyle = layer.color;
      for (let x = -(offset % spacing) - spacing; x < w + spacing; x += spacing) {
        ctx.fillRect(x + 14, GROUND_Y - 45, 10, 45);
        ctx.fillRect(x + 6,  GROUND_Y - 35, 8, 7);
        ctx.fillRect(x + 6,  GROUND_Y - 42, 7, 7);
        ctx.fillRect(x + 24, GROUND_Y - 30, 8, 7);
        ctx.fillRect(x + 27, GROUND_Y - 37, 7, 7);
      }

    } else if (type === 'fog') {
      ctx.fillStyle = layer.color;
      for (let x = -(offset % 200) - 200; x < w + 200; x += 200) {
        ctx.beginPath();
        ctx.ellipse(x + 100, y0, 120, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function _drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  return { init, update, draw };
})();

window.TravelBackground = TravelBackground;
console.log('✅ travel-background.js loaded');