// === TRAVEL BACKGROUND / PARALLAX RENDERER ===
// Handles all background drawing including layered parallax scrolling.

const TravelBackground = (() => {
  const C = () => window.TravelConstants;

  // Parallax offsets per layer (pixels scrolled)
  let layerOffsets = [];
  let cloudOffsets = [];
  let currentBiome = null;

  function init(biomeId) {
    const biomes = C().BIOMES;
    currentBiome = biomes[biomeId] || biomes.plains;
    layerOffsets = currentBiome.parallax.map(() => 0);
    cloudOffsets = currentBiome.clouds.map(c => ({ ...c, ox: 0 }));
  }

  function update(gameSpeed) {
    if (!currentBiome) return;
    currentBiome.parallax.forEach((layer, i) => {
      layerOffsets[i] = (layerOffsets[i] + gameSpeed * layer.speed) % 800;
    });
    cloudOffsets.forEach(c => {
      c.ox = (c.ox + gameSpeed * 0.18) % 900;
    });
  }

  function draw(ctx, canvas, frameCount, gameSpeed) {
    if (!currentBiome) return;
    const b = currentBiome;
    const w = canvas.width;
    const h = canvas.height;
    const GROUND_Y = C().GROUND_Y;

    // --- Sky ---
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, b.sky.top);
    skyGrad.addColorStop(1, b.sky.bottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, GROUND_Y);

    // --- Parallax layers (back to front) ---
    currentBiome.parallax.forEach((layer, i) => {
      _drawLayer(ctx, w, h, GROUND_Y, layer, layerOffsets[i]);
    });

    // --- Clouds (gentle float) ---
    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    cloudOffsets.forEach(c => {
      const cx = ((c.x + c.ox) % (w + 120)) - 60;
      _drawCloud(ctx, cx, c.y, c.size);
    });

    // --- Ground ---
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, h);
    groundGrad.addColorStop(0, b.ground.top);
    groundGrad.addColorStop(0.3, b.ground.mid);
    groundGrad.addColorStop(1, b.ground.bot);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);

    // Ground top strip
    ctx.fillStyle = b.ground.strip;
    ctx.fillRect(0, GROUND_Y, w, 5);

    // Moving dust streaks
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
      for (let x = -offset; x < w + 100; x += 180) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 30, y0 - 60);
        ctx.lineTo(x + 90, y0 - 100);
        ctx.lineTo(x + 150, y0 - 55);
        ctx.lineTo(x + 180, GROUND_Y);
        ctx.fill();
      }

    } else if (type === 'hills' || type === 'dunes_far' || type === 'dunes_mid') {
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(-offset - 10, GROUND_Y);
      const step = 120;
      for (let x = -offset - step; x < w + step * 2; x += step) {
        ctx.bezierCurveTo(
          x + step * 0.25, y0 * 0.92,
          x + step * 0.75, y0 * 1.08,
          x + step, y0
        );
      }
      ctx.lineTo(w + step, GROUND_Y);
      ctx.closePath();
      ctx.fill();

    } else if (type === 'trees' || type === 'trees_far' || type === 'trees_mid') {
      ctx.fillStyle = layer.color;
      const spacing = type === 'trees_far' ? 90 : type === 'trees_mid' ? 60 : 75;
      const treeH = type === 'trees_far' ? 50 : type === 'trees_mid' ? 70 : 60;
      const treeW = spacing * 0.55;
      for (let x = -offset % spacing - spacing; x < w + spacing; x += spacing) {
        // Trunk
        ctx.fillRect(x + treeW * 0.4, GROUND_Y - treeH * 0.3, treeW * 0.2, treeH * 0.35);
        // Canopy (2 tiers)
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - treeH * 0.25);
        ctx.lineTo(x + treeW * 0.5, GROUND_Y - treeH);
        ctx.lineTo(x + treeW, GROUND_Y - treeH * 0.25);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + treeW * 0.1, GROUND_Y - treeH * 0.45);
        ctx.lineTo(x + treeW * 0.5, GROUND_Y - treeH * 1.15);
        ctx.lineTo(x + treeW * 0.9, GROUND_Y - treeH * 0.45);
        ctx.fill();
      }

    } else if (type === 'cacti') {
      ctx.fillStyle = layer.color;
      const spacing = 140;
      for (let x = -offset % spacing - spacing; x < w + spacing; x += spacing) {
        // Body
        ctx.fillRect(x + 14, GROUND_Y - 45, 10, 45);
        // Arms
        ctx.fillRect(x + 6, GROUND_Y - 35, 8, 7);
        ctx.fillRect(x + 6, GROUND_Y - 42, 7, 7);
        ctx.fillRect(x + 24, GROUND_Y - 30, 8, 7);
        ctx.fillRect(x + 27, GROUND_Y - 37, 7, 7);
      }

    } else if (type === 'fog') {
      // Rolling fog ribbons
      ctx.fillStyle = layer.color;
      for (let x = -offset % 200 - 200; x < w + 200; x += 200) {
        ctx.beginPath();
        ctx.ellipse(x + 100, y0 * 1.0, 120, 18, 0, 0, Math.PI * 2);
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