// === COMMUNITY GALLERY MODULE ===

// === LOAD COMMUNITY GALLERY ===
async function loadGallery() {
  const { data, error } = await sb
    .from('community_gallery')
    .select('*')
    .order('created_at', { ascending: false });
  
  const galleryEl = document.getElementById('gallery-list');
  
  if (error) {
    galleryEl.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
        <h3>Gallery Error</h3>
        <p>${error.message}</p>
        <p>Check console (F12) for details.</p>
      </div>
    `;
    return;
  }
  
  if (!data || data.length === 0) {
    galleryEl.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #7f8c8d;">
        <h3>No horses yet!</h3>
        <p>Be the first to upload after login 🐎</p>
      </div>
    `;
    return;
  }
  
  galleryEl.innerHTML = data.map(horse => `
    <div class="horse-card">
      <h3>🐎 ${horse.creator_name}</h3>
      <pre>${JSON.stringify(horse.horse_dna, null, 2)}</pre>
      <div>
        <button onclick="alert('Buy: ${horse.id} (100 Gold)')">💰 Buy (100 Gold)</button>
        <button onclick="deleteHorse('${horse.id}')">🗑️ Delete (owner only)</button>
        <span style="float: right; color: #27ae60;">⭐ ${horse.votes || 0}</span>
      </div>
    </div>
  `).join('');
}

// === DELETE HORSE (RLS protected) ===
async function deleteHorse(id) {
  const { error } = await sb
    .from('community_gallery')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Delete failed: ' + (error.message || 'Not your horse'));
  } else {
    loadGallery();
    alert('Horse deleted!');
  }
}