import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration is missing. Check the local environment file.');
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
  throw new Error('Supabase must use HTTPS outside local development.');
}

if (supabaseKey.startsWith('sb_secret_')) {
  throw new Error('A Supabase secret key cannot be used in a browser application. Use the publishable key.');
}

try {
  const claims = JSON.parse(atob(supabaseKey.split('.')[1] || '')) as { role?: string };
  if (claims.role === 'service_role') throw new Error('A Supabase service-role key cannot be used in a browser application.');
} catch (error) {
  if (error instanceof Error && error.message.includes('service-role')) throw error;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Keep the refreshable Auth session scoped to this browser tab/session.
    // This does not replace RLS; it reduces how long a stolen token persists.
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
