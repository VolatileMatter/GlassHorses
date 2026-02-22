// === TRAVEL OBSTACLES (ROCKS) ===
// Rocks are the primary obstacle in travel mode.
// Styled per biome. Only the lead horse needs to clear them.

const TravelObstacles = (() => {
  let rocks = [];
  let nextRockIn = 100;
  let biomeStyle = { body: '#777', highlight: '#999' };

  function reset(biomeId) {
    rocks = [];
    nextRockIn = 110;
    const C = window.TravelConstants;
    const biome = C.BIOMES[biomeId] || C.BIOMES.plains;
    biomeStyle = biome.rockStyle;
  }

  function update(canvasWidth, gameSpeed) {
    nextRockIn--;
    if (nextRockIn <= 0) {
      rocks.push(_makeRock(canvasWidth));
      // Space rocks further apart at higher speeds to keep it manageable
      nextRockIn = Math.floor(65 + Math.random() * 90 + (gameSpeed * 3));
    }
    rocks.forEach(r => { r.x -= gameSpeed; });
    rocks = rocks.filter(r => r.x + r.w > -20);
  }

  function _makeRock(canvasWidth) {
    const C = window.TravelConstants;
    const h = 28 + Math.random() * 32;
    const w = 38 + Math.random() * 22;
    return {
      x: canvasWidth + 20,
      y: C.GROUND_Y - h,
      w, h,
    };
  }

  function getBounds() {
    return rocks.map(r => ({
      x: r.x + 5,
      y: r.y + 5,
      w: r.w - 10,
      h: r.h - 5,
    }));
  }

  function draw(ctx) {
    rocks.forEach(r => _drawRock(ctx, r));
  }

  function _drawRock(ctx, r) {
    const { x, y, w, h } = r;
    ctx.fillStyle = biomeStyle.body;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h);
    ctx.lineTo(x, y + h * 0.6);
    ctx.lineTo(x + w * 0.1, y + h * 0.2);
    ctx.lineTo(x + w * 0.4, y);
    ctx.lineTo(x + w * 0.75, y + h * 0.1);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.lineTo(x + w * 0.85, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = biomeStyle.highlight;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.15);
    ctx.lineTo(x + w * 0.6, y + h * 0.05);
    ctx.lineTo(x + w * 0.7, y + h * 0.3);
    ctx.lineTo(x + w * 0.35, y + h * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  return { reset, update, draw, getBounds };
})();

window.TravelObstacles = TravelObstacles;
console.log('✅ travel-obstacles.js loaded');