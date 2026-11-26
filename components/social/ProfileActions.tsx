'use client';

import { useEffect, useRef, useState } from 'react';
import { myLists, setBlocked, reportUserMail } from '../../lib/social';
import FollowButton from './FollowButton';
import { useMe } from './useMe';

// On a public profile (plan F5.1, F5.6): follower count, Follow, and "…" with report (e-mail,
// as in the app) and block/unblock. Nothing of this on your own profile.
export default function ProfileActions({ userId, name, followers, locale, labels }: {
  userId: string; name: string; followers: number; locale: string;
  labels: { followers: string; follow: string; following: string; signIn: string; more: string; report: string; block: string; unblock: string; blockTitle: string; blockConfirm: string };
}) {
  const { me, client } = useMe();
  const [count, setCount] = useState(followers);
  const [open, setOpen] = useState(false);
  const [blocked, setBlockedState] = useState(false);
  const acted = useRef(false);

  useEffect(() => {
    if (!me || me === userId) return;
    client().then(c => myLists(c, me)).then(l => { if (!acted.current) setBlockedState(l.blocked.includes(userId)); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, userId]);

  async function toggleBlock() {
    if (!me) return;
    acted.current = true;
    if (!blocked && !window.confirm(`${labels.blockTitle.replace('{name}', name)}\n\n${labels.blockConfirm}`)) return;
    if (await setBlocked(await client(), me, userId, !blocked)) setBlockedState(!blocked);
    setOpen(false);
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
      <span className="text-sm text-muted"><strong className="text-ink">{count}</strong> {labels.followers}</span>
      <FollowButton userId={userId} locale={locale} labels={{ follow: labels.follow, following: labels.following, signIn: labels.signIn }}
        onChange={on => setCount(c => Math.max(0, c + (on ? 1 : -1)))} />
      {me !== userId && (
        <div className="relative">
          <button type="button" aria-label={labels.more} aria-expanded={open} onClick={() => setOpen(o => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted hover:text-ink">⋯</button>
          {open && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-s2 text-left shadow-card sm:left-auto sm:right-0">
              <a href={reportUserMail(userId, name)} className="block px-4 py-2.5 text-sm hover:bg-surface" onClick={() => setOpen(false)}>{labels.report}</a>
              {me && (
                <button type="button" onClick={toggleBlock} className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-surface ${blocked ? '' : 'text-red-300'}`}>
                  {blocked ? labels.unblock : labels.block}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
