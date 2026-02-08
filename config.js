// === SUPABASE CONFIGURATION ===
const supabaseUrl = 'https://usfzylsxzznpkuklehbt.supabase.co';
const supabaseKey = 'sb_publishable_cHJ36KwZaEEC38BXJXEnfQ_X_e1RU8U';

// Create Supabase client
const sb = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'glasshorses-auth'
  }
});

// === GOOGLE DRIVE CONFIG ===
const CLIENT_ID = '515090161385-jnmj9bp7p9i6uegdr0lqo5opbte2ivee.apps.googleusercontent.com';

// === APP VERSION ===
const APP_VERSION = '1.0.0';

console.log(`✅ GlassHorses v${APP_VERSION} configured`);
console.log(`✅ Supabase: Connected`);
console.log(`✅ Google Client ID: Set`);