// === MAIN APPLICATION ===

// === INITIALIZATION ===
async function initializeApp() {
  console.log('🚀 GlassHorses app initializing...');
  
  try {
    // Check authentication state first
    const { data: { session } } = await sb.auth.getSession();
    console.log('🔐 Session check:', session ? 'Active' : 'No session');
    
    // Load gallery (will show public content)
    await loadGallery();
    
    // Log available functions
    console.log('✅ App initialized successfully');
    console.log('✅ createPlayerSaveFolder:', typeof window.createPlayerSaveFolder);
    console.log('✅ signInWithGoogle:', typeof window.signInWithGoogle);
    console.log('✅ loadGallery:', typeof loadGallery);
    
    // Show app ready state
    const galleryEl = document.getElementById('gallery-list');
    if (galleryEl && galleryEl.innerHTML.includes('Loading gallery')) {
      // If gallery didn't load properly, show status
      const { data, error } = await sb
        .from('community_gallery')
        .select('count')
        .single();
      
      if (error) {
        galleryEl.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
            <h3>Database Connection Issue</h3>
            <p>Unable to connect to gallery. Please refresh or check your connection.</p>
          </div>
        `;
      }
    }
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    
    // Show user-friendly error
    const galleryEl = document.getElementById('gallery-list');
    if (galleryEl) {
      galleryEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
          <h3>Application Error</h3>
          <p>Failed to initialize. Please refresh the page.</p>
          <p><small>Error: ${error.message}</small></p>
        </div>
      `;
    }
  }
}

// === PAGE LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, starting app...');
  
  // Initialize with a small delay to ensure all scripts are loaded
  setTimeout(() => {
    initializeApp();
  }, 100);
});

// === ERROR HANDLING ===
window.addEventListener('error', (event) => {
  console.error('🌐 Global error caught:', event.error);
  
  // Don't show alert for common network errors
  if (event.message && (
    event.message.includes('Failed to fetch') ||
    event.message.includes('NetworkError') ||
    event.message.includes('Load failed')
  )) {
    console.warn('⚠️ Network error, user might be offline');
    return;
  }
  
  // Show user-friendly message for critical errors
  if (event.message && event.message.includes('createPlayerSaveFolder')) {
    const statusEl = document.getElementById('drive-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="drive-error">
          ❌ Google Drive module failed to load
          <br><small>Please refresh the page and try again</small>
        </div>
      `;
    }
  }
});