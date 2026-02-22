// === TRAVEL OBSTACLES (ROCKS) ===

const TravelObstacles = (() => {
  let rocks      = [];
  let nextRockIn = 110;
  let rockStyle  = { body: '#777', highlight: '#999' };

  function reset(biomeId) {
    rocks      = [];
    nextRockIn = 110;
    const TC   = window.TravelConstants;
    const biome = TC && TC.BIOMES[biomeId] ? TC.BIOMES[biomeId] : null;
    rockStyle  = biome ? biome.rockStyle : { body: '#777', highlight: '#999' };
  }

  function update(canvasWidth, gameSpeed) {
    nextRockIn--;
    if (nextRockIn <= 0) {
      const TC = window.TravelConstants;
      const GROUND_Y = TC ? TC.GROUND_Y : 300;
      const h = 28 + Math.random() * 32;
      const w = 38 + Math.random() * 22;
      rocks.push({ x: canvasWidth + 20, y: GROUND_Y - h, w, h });
      nextRockIn = Math.floor(65 + Math.random() * 90 + gameSpeed * 3);
    }
    rocks.forEach(r => { r.x -= gameSpeed; });
    rocks = rocks.filter(r => r.x + r.w > -20);
  }

  function getBounds() {
    return rocks.map(r => ({ x: r.x + 5, y: r.y + 5, w: r.w - 10, h: r.h - 5 }));
  }

  function draw(ctx) {
    rocks.forEach(r => {
      const { x, y, w, h } = r;
      ctx.fillStyle = rockStyle.body;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.15, y + h);
      ctx.lineTo(x,             y + h * 0.6);
      ctx.lineTo(x + w * 0.1,  y + h * 0.2);
      ctx.lineTo(x + w * 0.4,  y);
      ctx.lineTo(x + w * 0.75, y + h * 0.1);
      ctx.lineTo(x + w,        y + h * 0.5);
      ctx.lineTo(x + w * 0.85, y + h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rockStyle.highlight;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3,  y + h * 0.15);
      ctx.lineTo(x + w * 0.6,  y + h * 0.05);
      ctx.lineTo(x + w * 0.7,  y + h * 0.3);
      ctx.lineTo(x + w * 0.35, y + h * 0.4);
      ctx.closePath();
      ctx.fill();
    });
  }

  return { reset, update, draw, getBounds };
})();

window.TravelObstacles = TravelObstacles;
console.log('✅ travel-obstacles.js loaded');