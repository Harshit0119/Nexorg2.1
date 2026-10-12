import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment (support Next.js and Vite env prefixes)
const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  '';

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

// Singleton Supabase Client
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient {
  const url = customUrl || supabaseUrl;
  const key = customKey || supabaseAnonKey;

  if (!url || !key || url.includes('your-project-id')) {
    // Return a dummy/safe client to prevent runtime initialization crashes
    return createClient('https://placeholder-nexorg.supabase.co', 'placeholder-key', {
      auth: { persistSession: false },
    });
  }

  if (!clientInstance || customUrl) {
    clientInstance = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return clientInstance;
}

export const supabase = getSupabaseClient();
