// ui/ui-modal.js
// Create herd modal

// ==================== CREATE HERD MODAL ====================
window.openCreateHerdModal = function() {
  document.getElementById('create-herd-modal').classList.add('open');
  document.getElementById('new-herd-name').value = '';
  document.getElementById('new-herd-desc').value = '';
  setTimeout(() => document.getElementById('new-herd-name').focus(), 50);
};

window.closeCreateHerdModal = function() {
  document.getElementById('create-herd-modal').classList.remove('open');
};

window.submitCreateHerd = function() {
  const name = document.getElementById('new-herd-name').value.trim();
  if (!name) { document.getElementById('new-herd-name').focus(); return; }
  const desc = document.getElementById('new-herd-desc').value.trim();
  if (!window.HorseManager) { window.closeCreateHerdModal(); return; }
  const id = window.HorseManager.createHerd(name, desc);
  window.HorseManager.setActiveHerd(id);
  window.closeCreateHerdModal();
  window.refreshHerdTabs?.();
  window.refreshDebugHerdSwitcher?.();
  window.renderDebugRoster?.();
};
// Mark this script as loaded
window.scriptsLoaded.uiMode = true;
window.checkAllScriptsLoaded();