import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { authStorage } from './authStorage';
import { supabaseConfig } from './supabaseConfig';

let client: SupabaseClient | null = null;

/**
 * The app's single Supabase client, or null in preview mode (no project configured).
 * PKCE flow: password-reset links carry a one-time code that only this browser can
 * exchange. Created lazily so preview builds never open a connection.
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfig) return null;
  client ??= createClient(supabaseConfig.url, supabaseConfig.key, {
    auth: {
      flowType: 'pkce',
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
  return client;
}

export const isSupabaseConfigured = () => supabaseConfig !== null;
