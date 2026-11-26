import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

// Anonymous client without cookies, for static pages (guide pages, sitemap). It reads only what
// RLS lets everyone read, and never makes a page dynamic (plan/01-arkitektur.md, Rendering).
let client: ReturnType<typeof createClient> | null = null;
export function publicClient() {
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
