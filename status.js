// status.js
// Status module - displays herd information as a canvas-rendered view

window.StatusModule = (function() {
  let canvas = null;
  let ctx = null;
  let animationFrame = null;
  let mounted = false;
  
  function mount(container) {
    console.log('StatusModule.mount called');
    
    if (!container) {
      console.error('StatusModule: No container provided');
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 400;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.background = 'rgba(20, 20, 30, 0.95)';
    canvas.style.borderRadius = '12px';
    canvas.style.border = '2px solid rgba(0, 255, 255, 0.3)';
    canvas.style.boxShadow = 'inset 0 0 30px rgba(138, 43, 226, 0.3)';
    
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');
    
    mounted = true;
    
    // Initial render
    render();
    
    // Handle resize
    window.addEventListener('resize', handleResize);
  }
  
  function unmount() {
    console.log('StatusModule.unmount called');
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    
    window.removeEventListener('resize', handleResize);
    
    if (canvas && canvas.parentNode) {
      canvas.parentNode.innerHTML = ''; // Clear the container
    }
    
    canvas = null;
    ctx = null;
    mounted = false;
  }
  
  function handleResize() {
    if (!mounted || !canvas || !canvas.parentNode) return;
    
    const container = canvas.parentNode;
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 400;
    render();
  }
  
  function render() {
    if (!mounted || !ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get data
    const horses = window.HorseManager ? window.HorseManager.getHorses() : [];
    const activeHerd = window.HorseManager ? window.HorseManager.getActiveHerd() : null;
    const herdName = activeHerd ? activeHerd.meta.herd_name : 'No Herd';
    
    // Draw title
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillText(`${herdName} — Status`, 30, 50);
    ctx.shadowBlur = 0;
    
    // Draw horse count
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(`${horses.length} horses`, 30, 85);
    
    if (!horses || horses.length === 0) {
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText('No horses in this herd', 30, 150);
      return;
    }
    
    // Draw each horse
    const startY = 120;
    const rowHeight = 70;
    const cols = 2;
    const colWidth = canvas.width / cols - 40;
    
    horses.forEach((horse, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = 30 + (col * (colWidth + 20));
      const y = startY + (row * rowHeight);
      
      // Don't render if off screen
      if (y + rowHeight > canvas.height) return;
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 0;
      ctx.fillRect(x, y, colWidth, rowHeight - 10);
      
      // Draw color swatch
      ctx.fillStyle = horse.color || '#8B5E3C';
      ctx.shadowBlur = 15;
      ctx.shadowColor = horse.color || '#8B5E3C';
      ctx.beginPath();
      ctx.arc(x + 25, y + 25, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Horse name
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(horse.barn_name || horse.name || 'Unnamed', x + 50, y + 20);
      
      // Formal name
      ctx.font = 'italic 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(horse.formal_name || '', x + 50, y + 38);
      
      // Stats
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#00ffff';
      
      const health = Math.floor(horse.health || 100);
      const hunger = Math.floor(horse.hunger || 75);
      
      ctx.fillText(`${horse.sex || '?'}, age ${horse.age || '?'}`, x + colWidth - 120, y + 20);
      ctx.fillText(`Health ${health}%`, x + colWidth - 120, y + 38);
      ctx.fillText(`Hunger ${hunger}%`, x + colWidth - 120, y + 56);
      
      // Status indicator
      const statusColor = window.statusColor ? window.statusColor(horse) : '#2ecc71';
      ctx.fillStyle = statusColor;
      ctx.fillRect(x + colWidth - 20, y + 10, 10, 10);
    });
    
    // Footer
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Click Status again to return to Graze', 30, canvas.height - 20);
  }
  
  // Public API
  return {
    mount,
    unmount
  };
})();

// Mark as loaded
if (typeof window.scriptsLoaded !== 'undefined') {
  window.scriptsLoaded.status = true;
  if (window.checkAllScriptsLoaded) window.checkAllScriptsLoaded();
}