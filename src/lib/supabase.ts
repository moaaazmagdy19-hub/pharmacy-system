import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from env vars or localStorage custom config
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || localStorage.getItem('pharmacy_supabase_url') || envUrl;
  const key = customKey || localStorage.getItem('pharmacy_supabase_anon_key') || envKey;

  if (!url || !key) {
    return null;
  }

  try {
    if (!cachedClient || customUrl || customKey) {
      cachedClient = createClient(url, key);
    }
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = localStorage.getItem('pharmacy_supabase_url') || envUrl;
  const key = localStorage.getItem('pharmacy_supabase_anon_key') || envKey;
  return Boolean(url && key);
}
