'use client';

import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasAuthCookie } from '../../lib/guides/likes';

// Who is signed in, for client parts of static pages (guide page, profile page): undefined while
// checking, null when signed out. Supabase is only loaded when the sign-in cookie is there.
export function useMe(): { me: string | null | undefined; client: () => Promise<SupabaseClient> } {
  const [me, setMe] = useState<string | null | undefined>(undefined);
  const sb = useRef<SupabaseClient | null>(null);
  const client = async () => {
    if (!sb.current) sb.current = (await import('../../lib/supabase/client')).createClient();
    return sb.current;
  };
  useEffect(() => {
    if (!hasAuthCookie()) { setMe(null); return; }
    let cancelled = false;
    client().then(c => c.auth.getSession()).then(({ data }) => { if (!cancelled) setMe(data.session?.user.id ?? null); });
    return () => { cancelled = true; };
  }, []);
  return { me, client };
}

export const loginHref = (locale: string) => `/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`;
