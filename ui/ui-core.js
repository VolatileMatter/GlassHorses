// ui/ui-core.js
// Core UI state and helper functions

// ==================== STATUS COLOUR ====================
window.statusColor = function(horse) {
  if (!horse) return '#2ecc71';
  if (horse.injured || (horse.health && horse.health < 30)) return '#e03030';
  if ((horse.health && horse.health < 70) || (horse.hunger && horse.hunger < 30)) return '#d4a017';
  return '#2ecc71';
};

// ==================== SCRIPT LOADING ====================
window.appLoaded = false;
window.scriptsLoaded = {
  config: false, auth: false, drive: false, gallery: false,
  horses: false, travel: false, graze: false, sleep: false, app: false,
  uiCore: false, uiHerds: false, uiDebug: false, uiStatus: false, uiModal: false, uiMode: false
};

window.checkAllScriptsLoaded = function() {
  if (Object.values(window.scriptsLoaded).every(Boolean)) {
    window.appLoaded = true;
    document.dispatchEvent(new CustomEvent('allScriptsLoaded'));
  }
};

window.handleScriptError = function(name) {
  console.warn(`Script ${name} failed to load`);
  window.scriptsLoaded[name] = true;
  window.checkAllScriptsLoaded();
};

// Mark this script as loaded
window.scriptsLoaded.uiCore = true;
window.checkAllScriptsLoaded();