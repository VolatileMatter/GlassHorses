// === HORSE MANAGER ===
// Central data store for all horse state.
// Loads from debug_horses/ in debug mode; hooks into Google Drive/Supabase in production.
// Supports multiple independent herds. New herds cached in sessionStorage until saved to Drive.

const HorseManager = (() => {

  const DEFAULT_RUNTIME = {
    hunger: 75, health: 100, mood: 'content', injured: false, sleepTicks: 0,
    x: 0, y: 0, vx: 0, vy: 0, legPhase: 0, grazeTimer: 0, eatTimer: 0, state: 'walk',
  };

  // herds: Map<herdId, { meta, horses[] }>
  let herds = new Map();
  let activeHerdId = null;
  let debugMode = false;
  let _onChangeCallbacks = [];

  // ---- Debug data (mirrors debug_horses/ on disk) ----
  const DEBUG_HERDS = [
    {
      meta: {
        herd_id: 'herd1',
        herd_name: 'Ironmoor Stable',
        description: 'A rugged working stable on the edge of the Ashfen. Known for hardy, dependable horses.',
        created: '2024-01-01',
        drive_folder_id: null,
      },
      horses: [
        {
          id: 'horse_shadowmere', herd_id: 'herd1',
          barn_name: 'Shadowmere', formal_name: 'Dark Sovereign of the Ashfen',
          current_herd: 'Ironmoor Stable', birth_herd: 'Ashfen Wilds',
          birthday: '2021-03-14', sex: 'stallion', color: '#2a1a10',
          personality: { temperament: 'stoic', traits: ['brave', 'stubborn', 'loyal'], notes: 'Rarely spooked. Bonds deeply with one rider. Distrustful of strangers at first.' },
          genetics: { coat: 'black', markings: 'none', build: 'heavy', dominant_genes: ['G_black', 'G_heavy_build'], recessive_genes: ['G_speed_burst'], notes: 'Placeholder — full gene system coming soon.' },
          abilities: [
            { id: 'ability_nightrunner', name: 'Night Runner', description: 'Recovers more HP during sleep ticks.', active_in: ['sleep'], placeholder: true },
            { id: 'ability_ironhide', name: 'Iron Hide', description: 'Takes reduced injury damage during travel.', active_in: ['travel'], placeholder: true },
          ],
        },
        {
          id: 'horse_blaze', herd_id: 'herd1',
          barn_name: 'Blaze', formal_name: 'Ember Crown of the Cinderfields',
          current_herd: 'Ironmoor Stable', birth_herd: 'Cinderfields Ranch',
          birthday: '2019-07-04', sex: 'mare', color: '#c0602a',
          personality: { temperament: 'spirited', traits: ['energetic', 'competitive', 'affectionate'], notes: "First to run, first to eat. Loves racing and sulks when she loses." },
          genetics: { coat: 'chestnut', markings: 'blaze (forehead stripe)', build: 'athletic', dominant_genes: ['G_chestnut', 'G_speed'], recessive_genes: ['G_endurance', 'G_palomino'], notes: 'Placeholder — full gene system coming soon.' },
          abilities: [
            { id: 'ability_headstart', name: 'Head Start', description: 'Speed boost at the start of each Travel run.', active_in: ['travel'], placeholder: true },
            { id: 'ability_eager_grazer', name: 'Eager Grazer', description: 'Restores hunger 20% faster while grazing.', active_in: ['graze'], placeholder: true },
          ],
        },
        {
          id: 'horse_copperkettle', herd_id: 'herd1',
          barn_name: 'Copperkettle', formal_name: 'Gilded Wanderer of the Dustroads',
          current_herd: 'Ironmoor Stable', birth_herd: 'Dustroads Caravan',
          birthday: '2013-09-22', sex: 'gelding', color: '#b87333',
          personality: { temperament: 'calm', traits: ['wise', 'patient', 'protective'], notes: 'The old hand of the stable. Younger horses follow his lead.' },
          genetics: { coat: 'copper roan', markings: 'four white socks', build: 'draft', dominant_genes: ['G_roan', 'G_draft_build'], recessive_genes: ['G_endurance', 'G_white_markings'], notes: 'Placeholder — full gene system coming soon.' },
          abilities: [
            { id: 'ability_herd_calm', name: 'Herd Calm', description: 'Nearby horses recover mood faster while grazing.', active_in: ['graze'], placeholder: true },
            { id: 'ability_trail_wise', name: 'Trail Wise', description: 'Warns the herd of incoming obstacles earlier.', active_in: ['travel'], placeholder: true },
            { id: 'ability_deep_sleep', name: 'Deep Sleep', description: 'Heals double HP per sleep tick, but wakes hungry.', active_in: ['sleep'], placeholder: true },
          ],
        },
      ],
    },
    {
      meta: {
        herd_id: 'herd2',
        herd_name: 'Frostmere Highlands',
        description: 'A gentler highland herd roaming the cold northern meadows. Smaller horses, big personalities.',
        created: '2024-01-01',
        drive_folder_id: null,
      },
      horses: [
        {
          id: 'horse_snowflake', herd_id: 'herd2',
          barn_name: 'Snowflake', formal_name: 'Pale Grace of the Frostmere',
          current_herd: 'Frostmere Highlands', birth_herd: 'Frostmere Highlands',
          birthday: '2023-01-19', sex: 'filly', color: '#d4d0c8',
          personality: { temperament: 'gentle', traits: ['curious', 'nervous', 'sweet'], notes: 'Young and still finding her confidence. Easily startled but recovers quickly.' },
          genetics: { coat: 'gray', markings: 'snowflake dapples', build: 'light', dominant_genes: ['G_gray', 'G_dapple'], recessive_genes: ['G_white', 'G_light_build'], notes: 'Placeholder — full gene system coming soon.' },
          abilities: [
            { id: 'ability_quick_learner', name: 'Quick Learner', description: 'Gains bonus XP from all activities.', active_in: ['graze', 'travel', 'sleep'], placeholder: true },
            { id: 'ability_lucky_stumble', name: 'Lucky Stumble', description: 'Survives one fatal obstacle per Travel run.', active_in: ['travel'], placeholder: true },
          ],
        },
        {
          id: 'horse_marigold', herd_id: 'herd2',
          barn_name: 'Marigold', formal_name: 'Golden Bloom of the Hearthfield',
          current_herd: 'Frostmere Highlands', birth_herd: 'Hearthfield Farm',
          birthday: '2020-05-01', sex: 'mare', color: '#d4a820',
          personality: { temperament: 'nurturing', traits: ['gentle', 'sociable', 'stubborn'], notes: "Gets along with every horse. Dislikes being separated from the herd." },
          genetics: { coat: 'palomino', markings: 'star (forehead)', build: 'medium', dominant_genes: ['G_palomino', 'G_medium_build'], recessive_genes: ['G_cremello', 'G_speed'], notes: 'Placeholder — full gene system coming soon.' },
          abilities: [
            { id: 'ability_bloom', name: 'In Full Bloom', description: 'Higher breeding success when hunger > 80%.', active_in: ['graze'], placeholder: true },
            { id: 'ability_herd_bond', name: 'Herd Bond', description: 'Recovers bonus mood sleeping next to 2+ herd members.', active_in: ['sleep'], placeholder: true },
          ],
        },
      ],
    },
  ];

  // ---- Helpers ----
  function calcAge(birthday) {
    if (!birthday) return 0;
    return Math.floor((Date.now() - new Date(birthday)) / (1000 * 60 * 60 * 24 * 365.25));
  }

  function mergeWithRuntime(jsonHorse) {
    return {
      ...DEFAULT_RUNTIME,
      hunger: 40 + Math.floor(Math.random() * 50),
      health: jsonHorse.injured ? 40 + Math.floor(Math.random() * 30) : 85 + Math.floor(Math.random() * 15),
      ...jsonHorse,
      age: calcAge(jsonHorse.birthday),
      name: jsonHorse.barn_name, // alias for renderers
    };
  }

  function generateHerdId() {
    return 'herd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  function notify() {
    _onChangeCallbacks.forEach(fn => {
      try { fn(herds, activeHerdId); } catch(e) {}
    });
  }

  function _persistCachedHerds() {
    try {
      const extra = [];
      const builtinIds = new Set(DEBUG_HERDS.map(d => d.meta.herd_id));
      herds.forEach((herd, id) => {
        if (!builtinIds.has(id)) extra.push(herd);
      });
      sessionStorage.setItem('gh_debug_herds', JSON.stringify(extra));
    } catch(e) { console.warn('Could not cache herds:', e); }
  }

  // ---- Load Debug Herds ----
  function loadDebugHerds() {
    debugMode = true;
    herds = new Map();
    DEBUG_HERDS.forEach(({ meta, horses }) => {
      herds.set(meta.herd_id, { meta: { ...meta }, horses: horses.map(mergeWithRuntime) });
    });
    activeHerdId = 'herd1';
    // Restore any user-created cached herds
    try {
      const cached = sessionStorage.getItem('gh_debug_herds');
      if (cached) {
        JSON.parse(cached).forEach(({ meta, horses }) => {
          if (!herds.has(meta.herd_id)) {
            herds.set(meta.herd_id, { meta: { ...meta }, horses: (horses || []).map(mergeWithRuntime) });
          }
        });
      }
    } catch(e) { console.warn('Could not restore cached herds:', e); }
    console.log(`🐛 Debug: loaded ${herds.size} herds`);
    notify();
    return herds;
  }

  function loadFromSave(saveData) {
    debugMode = false;
    herds = new Map();
    (saveData || []).forEach(({ meta, horses }) => {
      herds.set(meta.herd_id, { meta: { ...meta }, horses: (horses || []).map(mergeWithRuntime) });
    });
    activeHerdId = herds.size > 0 ? herds.keys().next().value : null;
    notify();
    return herds;
  }

  // ---- Herd CRUD ----
  function createHerd(name, description) {
    const id = generateHerdId();
    const meta = {
      herd_id: id,
      herd_name: name || 'New Herd',
      description: description || '',
      created: new Date().toISOString().split('T')[0],
      drive_folder_id: null,
    };
    herds.set(id, { meta, horses: [] });
    if (!activeHerdId) activeHerdId = id;
    if (debugMode) _persistCachedHerds();

    // Kick off Drive folder creation if authorized
    if (window.DriveManager) {
      window.DriveManager.createHerdFolder(meta)
        .then(folderId => {
          if (folderId) {
            herds.get(id).meta.drive_folder_id = folderId;
            if (debugMode) _persistCachedHerds();
            notify();
          }
        })
        .catch(e => console.warn('Drive herd folder creation failed:', e));
    }

    notify();
    console.log(`🐎 Herd created: ${name} [${id}]`);
    return id;
  }

  function renameHerd(herdId, newName) {
    const herd = herds.get(herdId);
    if (!herd) return;
    herd.meta.herd_name = newName;
    if (debugMode) _persistCachedHerds();
    notify();
  }

  function deleteHerd(herdId) {
    if (!herds.has(herdId)) return;
    herds.delete(herdId);
    if (activeHerdId === herdId) {
      activeHerdId = herds.size > 0 ? herds.keys().next().value : null;
    }
    if (debugMode) _persistCachedHerds();
    notify();
  }

  function setActiveHerd(herdId) {
    if (!herds.has(herdId)) return;
    activeHerdId = herdId;
    notify();
  }

  // ---- Getters ----
  function getHorses() {
    if (!activeHerdId || !herds.has(activeHerdId)) return [];
    return herds.get(activeHerdId).horses;
  }

  function getAllHerds() {
    return Array.from(herds.values());
  }

  function getActiveHerd() {
    return herds.get(activeHerdId) || null;
  }

  function getActiveHerdId() { return activeHerdId; }

  function getHorseById(id) {
    for (const herd of herds.values()) {
      const h = herd.horses.find(h => h.id === id);
      if (h) return h;
    }
    return null;
  }

  function isDebugMode() { return debugMode; }

  function recalcAges() {
    const today = new Date().toISOString().split('T')[0];
    herds.forEach(({ horses }) => {
      horses.forEach(h => { h.age = calcAge(h.birthday); h.age_last_calculated = today; });
    });
    console.log('🌙 Ages recalculated');
  }

  function exportForSave() {
    const RUNTIME_KEYS = Object.keys(DEFAULT_RUNTIME);
    return Array.from(herds.values()).map(({ meta, horses }) => ({
      meta: { ...meta },
      horses: horses.map(h => {
        const out = { ...h };
        RUNTIME_KEYS.forEach(k => delete out[k]);
        delete out.name;
        return out;
      }),
    }));
  }

  function onChange(fn) { _onChangeCallbacks.push(fn); }

  return {
    loadDebugHerds, loadFromSave,
    createHerd, renameHerd, deleteHerd, setActiveHerd,
    getHorses, getAllHerds, getActiveHerd, getActiveHerdId,
    getHorseById, isDebugMode, recalcAges, exportForSave, onChange,
  };
})();

window.HorseManager = HorseManager;
console.log('✅ horses.js loaded');