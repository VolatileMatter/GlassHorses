// === SUPABASE CONFIGURATION ===
const supabaseUrl = 'https://usfzylsxzznpkuklehbt.supabase.co';
const supabaseKey = 'sb_publishable_cHJ36KwZaEEC38BXJXEnfQ_X_e1RU8U'; // Replace from Supabase dashboard!
const sb = supabase.createClient(supabaseUrl, supabaseKey);

// === GOOGLE DRIVE CONFIGURATION ===
const CLIENT_ID = '515090161385-jnmj9bp7p9i6uegdr0lqo5opbte2ivee.apps.googleusercontent.com';

// === GLOBAL STATE ===
let gapiInited = false;
let driveClientReady = false;