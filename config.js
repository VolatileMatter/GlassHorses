// === SUPABASE CONFIGURATION ===
const supabaseUrl = 'https://usfzylsxzznpkuklehbt.supabase.co';
const supabaseKey = 'sb_publishable_cHJ36KwZaEEC38BXJXEnfQ_X_e1RU8U'; // Replace from Supabase dashboard!

// Create Supabase client with persistence
const sb = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Enable session persistence across browser restarts
    autoRefreshToken: true, // Automatically refresh expired tokens
    detectSessionInUrl: true, // Detect session in URL for OAuth redirects
    storage: window.localStorage, // Store session in localStorage
    storageKey: 'glasshorses-auth' // Custom storage key
  }
});

// === GOOGLE DRIVE CONFIGURATION ===
const CLIENT_ID = '515090161385-jnmj9bp7p9i6uegdr0lqo5opbte2ivee.apps.googleusercontent.com';

// === APP VERSION ===
const APP_VERSION = '1.0.0';
const DRIVE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

console.log(`✅ GlassHorses v${APP_VERSION} configured`);
console.log(`✅ Supabase: ${supabaseUrl ? 'Connected' : 'Missing URL'}`);
console.log(`✅ Google Client ID: ${CLIENT_ID ? 'Set' : 'Missing'}`);