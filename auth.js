// === AUTHENTICATION MODULE ===

// === AUTH STATE LISTENER ===
sb.auth.onAuthStateChange((event, session) => {
  const userNameEl = document.getElementById('user-name');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (session?.user) {
    userNameEl.textContent = session.user.user_metadata.full_name || session.user.email || 'Logged in';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    loadGallery();
  } else {
    userNameEl.textContent = 'Not logged in';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
});

// === GOOGLE LOGIN WITH DRIVE SCOPE ===
async function signInWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'openid email profile https://www.googleapis.com/auth/drive.appdata',
      redirectTo: window.location.origin
    }
  });
  if (error) {
    console.error('Login error:', error);
    alert('Login failed: ' + error.message);
  }
}

// === LOGOUT ===
async function signOut() {
  await sb.auth.signOut();
  document.getElementById('drive-status').innerHTML = '';
}