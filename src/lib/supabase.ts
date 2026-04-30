import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

let cachedClient: SupabaseClient | null = null;

function isPlaceholderValue(value: string): boolean {
  return /^(your|replace|changeme)[-_ ]/i.test(value);
}

function isValidSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export const SUPABASE_CONFIG_ERROR =
  isValidSupabaseUrl(supabaseUrl) &&
  supabaseAnonKey &&
  !isPlaceholderValue(supabaseAnonKey)
    ? null
    : 'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to valid public values.';

export const isSupabaseConfigured = SUPABASE_CONFIG_ERROR === null;

export function getSupabaseClient(): SupabaseClient {
  if (SUPABASE_CONFIG_ERROR) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return cachedClient;
}
