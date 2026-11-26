'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '../../lib/supabase/client';
import { markAllRead, type Notification } from '../../lib/notifications';

// The notifications page (plan M8): newest first, unread ones marked; opening the page marks
// them all read (the bell in the menu then goes quiet). A like, comment or new guide links to
// the guide, a follow to the follower's profile.

export default function NotificationList({ locale, items, profiles }: { locale: string; items: Notification[]; profiles: string[] }) {
  const t = useTranslations('notifications');
  const sb = useRef(createClient()).current;
  const hasProfile = new Set(profiles);

  useEffect(() => {
    if (items.some(n => !n.read)) {
      markAllRead(sb).then(() => window.dispatchEvent(new Event('tripshare:notifications-read')));
    }
  }, [items, sb]);

  if (!items.length) {
    return (
      <div className="mt-10 rounded-3xl border border-border bg-surface p-10 text-center">
        <p className="font-display text-xl font-bold">{t('empty')}</p>
        <p className="mt-2 text-sm text-muted">{t('emptySub')}</p>
      </div>
    );
  }

  const rtf = new Intl.RelativeTimeFormat(locale === 'no' ? 'nb' : locale, { numeric: 'auto' });
  const ago = (iso: string) => {
    const s = (new Date(iso).getTime() - Date.now()) / 1000;
    const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.35, 'week'], [12, 'month'], [Infinity, 'year']];
    let v = s;
    for (const [size, unit] of steps) {
      if (Math.abs(v) < size) return rtf.format(Math.round(v), unit);
      v /= size;
    }
    return '';
  };

  return (
    <ul className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
      {items.map(n => {
        const name = n.actorName.trim() || t('someone');
        const title = n.guideTitle.trim();
        const text = n.type === 'follow' ? t('follow', { name }) : t(n.type, { name, title });
        const href = n.type === 'follow'
          ? (hasProfile.has(n.actorId) ? `/${locale}/u/${encodeURIComponent(n.actorId)}` : null)
          : n.guideId ? `/g/${encodeURIComponent(n.guideId)}${n.type === 'comment' ? '#comments' : ''}` : null;
        const icon = { like: '♥', comment: '💬', follow: '👋', publish: '🌍' }[n.type];
        const body = (
          <div className="flex items-start gap-4 px-5 py-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${n.read ? 'bg-s2' : 'bg-accent/20'}`} aria-hidden>{icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm leading-relaxed ${n.read ? 'text-muted' : 'text-ink'}`}>{text}</p>
              <p className="mt-0.5 text-xs text-faint">{ago(n.createdAt)}</p>
            </div>
            {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label={t('unread')} />}
          </div>
        );
        return <li key={n.id}>{href ? <a href={href} className="block transition-colors hover:bg-s2">{body}</a> : body}</li>;
      })}
    </ul>
  );
}
