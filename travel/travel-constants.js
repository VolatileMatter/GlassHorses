// === TRAVEL CONSTANTS & BIOME DEFINITIONS ===
// All tuning lives here. Add new biomes by adding an entry to BIOMES.

const TravelConstants = {

  // Physics
  GRAVITY: 0.5,
  JUMP_FORCE_MIN: -10,
  JUMP_FORCE_MAX: -17,
  JUMP_HOLD_FRAMES: 22,
  GROUND_Y: 300,
  HORSE_WIDTH: 60,
  HORSE_HEIGHT: 50,

  // Speed
  SPEED_INITIAL: 4.5,
  SPEED_INCREMENT: 0.0004,
  SPEED_MAX: 12,

  // Collectibles / checkpoints
  CHECKPOINT_DISTANCE: 1200,
  APPLE_SPAWN_CHANCE: 0.003,

  // Biomes
  BIOMES: {
    plains: {
      id: 'plains',
      name: 'Rolling Plains',
      sky: { top: '#4a90d9', bottom: '#87ceeb' },
      ground: { top: '#6b4423', mid: '#5a3718', bot: '#3d2510', strip: '#7a5030' },
      parallax: [
        { type: 'mountains', speed: 0.05, color: '#a0b8c8', yBase: 0.45 },
        { type: 'hills',     speed: 0.15, color: '#5a8a3a', yBase: 0.55 },
        { type: 'trees',     speed: 0.30, color: '#2d5c20', yBase: 0.62 },
      ],
      clouds: [
        { x: 80,  y: 55, size: 60 },
        { x: 240, y: 35, size: 45 },
        { x: 450, y: 65, size: 70 },
        { x: 640, y: 38, size: 55 },
        { x: 820, y: 50, size: 48 },
      ],
      dustColor: 'rgba(139,90,43,0.25)',
      rockStyle: { body: '#777', highlight: '#999' },
    },

    forest: {
      id: 'forest',
      name: 'Darkwood Forest',
      sky: { top: '#1a3020', bottom: '#2d5040' },
      ground: { top: '#2a4a1a', mid: '#1e3612', bot: '#111a0a', strip: '#3a5a22' },
      parallax: [
        { type: 'trees_far', speed: 0.12, color: '#1a3010', yBase: 0.55 },
        { type: 'trees_mid', speed: 0.28, color: '#0f2008', yBase: 0.62 },
      ],
      clouds: [
        { x: 120, y: 45, size: 50 },
        { x: 380, y: 30, size: 40 },
        { x: 650, y: 55, size: 60 },
      ],
      dustColor: 'rgba(40,80,30,0.2)',
      rockStyle: { body: '#4a6a3a', highlight: '#5a8a4a' },
    },

    desert: {
      id: 'desert',
      name: 'Sunscorch Flats',
      sky: { top: '#c06020', bottom: '#e8a040' },
      ground: { top: '#c8a050', mid: '#b08838', bot: '#8a6020', strip: '#d4b060' },
      parallax: [
        { type: 'dunes_far', speed: 0.06, color: '#c09848', yBase: 0.50 },
        { type: 'dunes_mid', speed: 0.20, color: '#b08030', yBase: 0.58 },
      ],
      clouds: [
        { x: 200, y: 40, size: 35 },
        { x: 600, y: 30, size: 45 },
      ],
      dustColor: 'rgba(200,160,60,0.3)',
      rockStyle: { body: '#a07840', highlight: '#c09850' },
    },
  },
};

window.TravelConstants = TravelConstants;
console.log('✅ travel-constants.js loaded');