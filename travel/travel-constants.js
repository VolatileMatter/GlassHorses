// === TRAVEL CONSTANTS & BIOME DEFINITIONS ===
// Add new biomes here — each is a self-contained visual/gameplay config.

const TravelConstants = (() => {

  // Physics
  const GRAVITY = 0.5;
  const JUMP_FORCE_MIN = -10;      // Tap jump
  const JUMP_FORCE_MAX = -17;      // Full hold jump
  const JUMP_HOLD_FRAMES = 22;     // Frames you can hold to charge jump
  const GROUND_Y = 300;
  const HORSE_WIDTH = 60;
  const HORSE_HEIGHT = 50;

  // Speed
  const SPEED_INITIAL = 4.5;
  const SPEED_INCREMENT = 0.0004;
  const SPEED_MAX = 12;

  // Checkpoint / level system
  const CHECKPOINT_DISTANCE = 1200; // score units between checkpoints
  const APPLE_SCORE_VALUE = 5;      // score added per apple collected
  const APPLE_SPAWN_CHANCE = 0.003; // chance per frame to spawn an apple cluster

  // --- BIOMES ---
  // Each biome defines:
  //   id, name, sky colors, ground colors, obstacle style, parallax layers
  const BIOMES = {
    plains: {
      id: 'plains',
      name: 'Rolling Plains',
      sky: { top: '#4a90d9', bottom: '#87ceeb' },
      ground: { top: '#6b4423', mid: '#5a3718', bot: '#3d2510', strip: '#7a5030' },
      parallax: [
        // { type, speed, color, ... } — layers drawn back to front
        { type: 'mountains', speed: 0.05, color: '#a0b8c8', yBase: 0.45 },
        { type: 'hills',     speed: 0.15, color: '#5a8a3a', yBase: 0.55 },
        { type: 'trees',     speed: 0.30, color: '#2d5c20', yBase: 0.62 },
      ],
      clouds: [
        { x: 80,  y: 55,  size: 60 },
        { x: 240, y: 35,  size: 45 },
        { x: 450, y: 65,  size: 70 },
        { x: 640, y: 38,  size: 55 },
        { x: 820, y: 50,  size: 48 },
      ],
      dustColor: 'rgba(139, 90, 43, 0.25)',
      rockStyle: { body: '#777', highlight: '#999' },
    },

    forest: {
      id: 'forest',
      name: 'Darkwood Forest',
      sky: { top: '#1a3020', bottom: '#2d5040' },
      ground: { top: '#2a4a1a', mid: '#1e3612', bot: '#111a0a', strip: '#3a5a22' },
      parallax: [
        { type: 'fog',       speed: 0.03, color: 'rgba(100,160,100,0.08)', yBase: 0.5 },
        { type: 'trees_far', speed: 0.12, color: '#1a3010', yBase: 0.55 },
        { type: 'trees_mid', speed: 0.28, color: '#0f2008', yBase: 0.62 },
      ],
      clouds: [
        { x: 120, y: 45, size: 50 },
        { x: 380, y: 30, size: 40 },
        { x: 650, y: 55, size: 60 },
      ],
      dustColor: 'rgba(40, 80, 30, 0.2)',
      rockStyle: { body: '#4a6a3a', highlight: '#5a8a4a' },
    },

    desert: {
      id: 'desert',
      name: 'Sunscorch Flats',
      sky: { top: '#c06020', bottom: '#e8a040' },
      ground: { top: '#c8a050', mid: '#b08838', bot: '#8a6020', strip: '#d4b060' },
      parallax: [
        { type: 'dunes_far', speed: 0.06, color: '#c09848', yBase: 0.5 },
        { type: 'dunes_mid', speed: 0.20, color: '#b08030', yBase: 0.58 },
        { type: 'cacti',     speed: 0.35, color: '#3a7030', yBase: 0.65 },
      ],
      clouds: [
        { x: 200, y: 40, size: 35 },
        { x: 600, y: 30, size: 45 },
      ],
      dustColor: 'rgba(200, 160, 60, 0.3)',
      rockStyle: { body: '#a07840', highlight: '#c09850' },
    },
  };

  return {
    GRAVITY, JUMP_FORCE_MIN, JUMP_FORCE_MAX, JUMP_HOLD_FRAMES,
    GROUND_Y, HORSE_WIDTH, HORSE_HEIGHT,
    SPEED_INITIAL, SPEED_INCREMENT, SPEED_MAX,
    CHECKPOINT_DISTANCE, APPLE_SCORE_VALUE, APPLE_SPAWN_CHANCE,
    BIOMES,
  };
})();

window.TravelConstants = TravelConstants;
console.log('✅ travel-constants.js loaded');