import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

// Browser client for client components (one per tab). Sign-out must always be
// signOut({ scope: 'local' }): the default is global and would sign the app out too.
let client: ReturnType<typeof createBrowserClient> | null = null;
export function createClient() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
