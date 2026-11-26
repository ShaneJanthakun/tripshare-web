'use client';

import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasAuthCookie, isLiked, toggleLike } from '../../lib/guides/likes';

// ♥ on a guide (plan F4.6), as in the app: the count updates at once and is corrected from the
// answer; not on your own guide (you see the count only) and never on team guides (the caller
// leaves the button out). Signed out, a click goes to the login page and back.

export type LikeLabels = { like: string; unlike: string; signIn: string };

type Props = {
  guideId: string;
  authorId: string;
  count: number;
  locale: string;
  labels: LikeLabels;
  /** Known by the feed; the guide page finds out itself. null = signed out. */
  me?: string | null;
  liked?: boolean;
  variant?: 'page' | 'card';
  /** Told after a like or unlike went through. */
  onChange?: (liked: boolean, count: number) => void;
};

export default function LikeButton({ guideId, authorId, count: initialCount, locale, labels, me: knownMe, liked: knownLiked, variant = 'page', onChange }: Props) {
  const [me, setMe] = useState<string | null | undefined>(knownMe);
  const [liked, setLiked] = useState(knownLiked ?? false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const sb = useRef<SupabaseClient | null>(null);

  const client = async () => {
    if (!sb.current) sb.current = (await import('../../lib/supabase/client')).createClient();
    return sb.current;
  };

  useEffect(() => { if (knownLiked !== undefined) setLiked(knownLiked); }, [knownLiked]);
  useEffect(() => { if (knownMe !== undefined) setMe(knownMe); }, [knownMe]);
  useEffect(() => {
    if (knownMe !== undefined) return;
    if (!hasAuthCookie()) { setMe(null); return; }
    let cancelled = false;
    (async () => {
      const c = await client();
      const id = (await c.auth.getSession()).data.session?.user.id ?? null;
      if (cancelled) return;
      setMe(id);
      if (id && id !== authorId) setLiked(await isLiked(c, id, guideId));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownMe, guideId, authorId]);

  const own = !!me && me === authorId;
  const big = variant === 'page';

  async function click(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (me === undefined || busy) return;
    if (me === null) {
      window.location.assign(`/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (own) return;
    const was = liked;
    setLiked(!was);
    setCount(c => Math.max(0, c + (was ? -1 : 1)));
    setBusy(true);
    const res = await toggleLike(await client(), me, guideId);
    setBusy(false);
    if (res.count === null) { setLiked(was); setCount(c => Math.max(0, c + (was ? 1 : -1))); return; }
    setLiked(res.liked);
    setCount(res.count);
    onChange?.(res.liked, res.count);
  }

  if (own) {
    return count > 0 ? <span className={big ? 'text-sm text-muted' : 'text-xs font-semibold text-white'}>♥ {count}</span> : null;
  }
  const label = me === null ? labels.signIn : liked ? labels.unlike : labels.like;
  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={liked}
      aria-label={label}
      title={label}
      disabled={busy}
      className={big
        ? `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${liked ? 'border-accent bg-accent/15 text-accent' : 'border-border text-ink hover:border-accent/50'}`
        : `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-card backdrop-blur transition-colors ${liked ? 'bg-accent text-white' : 'bg-black/55 text-white hover:bg-black/75'}`}
    >
      <svg className={big ? 'h-4 w-4' : 'h-3.5 w-3.5'} viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 18.8 5 21 8.3 19.5 11.8 17.5 16.4 12 21 12 21z" />
      </svg>
      {count}
    </button>
  );
}
