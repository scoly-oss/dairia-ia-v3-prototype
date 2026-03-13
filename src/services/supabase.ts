import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

if (!DEMO_MODE && (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key')) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client Supabase principal
 * Configuration simple avec rafraîchissement automatique des tokens activé
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    timeout: 60000,
    params: {
      eventsPerSecond: 10,
      heartbeat_interval: 15000,
      retry_interval: 5000,
      retry_count: 3
    }
  },
  db: {
    schema: 'public'
  }
});

if (!DEMO_MODE) {
  console.log('[supabase] Client principal créé avec configuration standard');
}
