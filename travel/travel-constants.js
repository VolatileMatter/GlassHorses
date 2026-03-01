// === TRAVEL CONSTANTS & BIOME DEFINITIONS ===
// All tuning lives here. Add new biomes by adding an entry to BIOMES.

const TravelConstants = {

  // Physics
  GRAVITY: 0.55,             // Normal gravity — horse reaches apex quickly
  HOLD_FALL_GRAVITY: 0.18,   // Reduced gravity when falling AND button still held = soft landing
  JUMP_VELOCITY: -13,       // doubled jump height       // Upward snap on press
  MAX_HOLD_FRAMES: 28,       // Max frames hold can slow the fall (only active while falling)
  FALL_GRAVITY_MULT: 1.7,    // Extra gravity when falling WITHOUT hold = snappy drop
  GROUND_Y: 300,
  HORSE_SCALE: 0.72,
  HORSE_WIDTH: 60,
  HORSE_HEIGHT: 50,

  // Horizontal lunge on jump — horse moves forward while airborne, drifts back slowly on ground
  LUNGE_FORWARD: 32,         // Pixels ahead of baseX while in the air
  LUNGE_RETURN: 0.018,       // Very slow lerp back to baseX after landing (feels gradual)

  // "Coyote time" — frames after leaving ground the player can still jump
  COYOTE_FRAMES: 7,
  // "Jump buffering" — frames before landing that a queued jump will auto-fire
  JUMP_BUFFER_FRAMES: 8,

  // Lead horse horizontal position (25% of 800px canvas = 200)
  LEAD_X: 200,
  // Pixel gap between each trailing horse
  HORSE_SPACING: 52,

  // Speed
  SPEED_INITIAL: 4.5,        // pixels/frame at 60fps ≈ 270px/s
  SPEED_INCREMENT: 0.0004,
  SPEED_MAX: 12,

  // ---- Tile system ----
  // 1 tile = 10 metres = 100px of travel
  // score is accumulated in METRES; tiles = Math.floor(score / 10)
  // At 60fps and speed=4.5: 4.5px/f * 0.01543 * 60f/s = 4.167 m/s = 15 km/h
  // Horse covers 1 tile (10m) in ~2.4 seconds at start speed
  SCORE_SCALE: 0.01543,      // converts px/frame → metres/frame
  METRES_PER_TILE: 10,       // 1 tile = 10 metres = 100px
  CHECKPOINT_TILES: 100,     // checkpoint every 100 tiles = 1 km

  // Terrain swaps: random interval between MIN and MAX tiles
  TERRAIN_SWAP_MIN_TILES: 50,
  TERRAIN_SWAP_MAX_TILES: 200,

  // Terrain speed multipliers
  TERRAIN_SPEED: {
    plains:  1.0,
    forest:  1.0,
    desert:  0.85,
    swamp:   0.6,
    downhill: 1.2,
  },

  // Collectibles / checkpoints
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