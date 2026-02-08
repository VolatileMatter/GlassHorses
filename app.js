// === MAIN APPLICATION ===

// === PAGE LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  // Load gallery on page load
  loadGallery();
  
  // Log availability of critical functions
  console.log('✅ App initialized');
  console.log('✅ createPlayerSaveFolder available:', typeof createPlayerSaveFolder);
  console.log('✅ signInWithGoogle available:', typeof signInWithGoogle);
  console.log('✅ loadGallery available:', typeof loadGallery);
});