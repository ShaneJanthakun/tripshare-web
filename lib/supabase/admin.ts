import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

// Service role: bypasses RLS. Server only, and only for writing geocode_cache
// (plan/01-arkitektur.md). Returns null when the key isn't configured, so callers degrade
// gracefully (no cache writes) instead of failing.
export function createAdminClient() {
  if (typeof window !== 'undefined') throw new Error('createAdminClient() must only run on the server');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
