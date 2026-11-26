'use client';

import { useEffect, useRef, useState } from 'react';
import { myLists, setFollowing } from '../../lib/social';
import { useMe, loginHref } from './useMe';

// Follow / Following (plan F5.1), on the guide page's author line and on public profiles.
// Not on your own profile or guide. Signed out, a click goes to the login page and back.
export default function FollowButton({ userId, locale, labels, onChange }: {
  userId: string;
  locale: string;
  labels: { follow: string; following: string; signIn: string };
  onChange?: (following: boolean) => void;
}) {
  const { me, client } = useMe();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const acted = useRef(false); // a click wins over the first check that may answer later

  useEffect(() => {
    if (!me || me === userId) return;
    let cancelled = false;
    client().then(c => myLists(c, me)).then(l => { if (!cancelled && !acted.current) setOn(l.following.includes(userId)); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, userId]);

  if (me === undefined || me === userId) return null;

  async function click() {
    if (!me) { window.location.assign(loginHref(locale)); return; }
    if (busy) return;
    acted.current = true;
    const next = !on;
    setOn(next);
    setBusy(true);
    const ok = await setFollowing(await client(), me, userId, next);
    setBusy(false);
    if (!ok) { setOn(!next); return; }
    onChange?.(next);
  }

  return (
    <button type="button" onClick={click} aria-pressed={on} disabled={busy} title={me ? undefined : labels.signIn}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${on ? 'border-accent bg-accent/15 text-accent' : 'border-border text-ink hover:border-accent/50'}`}>
      {on ? labels.following : labels.follow}
    </button>
  );
}
