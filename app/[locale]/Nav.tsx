'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../i18n/navigation';
import LangSwitcher from './LangSwitcher';
import { WEB_APP_PATH } from '../webapp';
import { SUPABASE_URL } from '../../lib/supabase/env';

// Signed in? Checked in the browser, so the marketing pages stay static. Supabase is only loaded
// when a session cookie exists; everyone else gets "Log in" without any extra download.
const AUTH_COOKIE = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!document.cookie.split('; ').some(c => c.startsWith(AUTH_COOKIE))) return;
    let unsub: (() => void) | undefined;
    import('../../lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
      unsub = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session)).data.subscription.unsubscribe;
    });
    return () => unsub?.();
  }, []);
  return signedIn;
}

// Unread notifications for the bell (plan M8); 0 when signed out or before M8 exists.
function useUnread(signedIn: boolean): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    const load = () => Promise.all([import('../../lib/supabase/client'), import('../../lib/notifications')])
      .then(([{ createClient }, { unreadCount }]) => unreadCount(createClient()))
      .then(c => { if (!cancelled) setN(c); });
    void load();
    const reset = () => setN(0);
    window.addEventListener('tripshare:notifications-read', reset);
    window.addEventListener('focus', load);
    return () => { cancelled = true; window.removeEventListener('tripshare:notifications-read', reset); window.removeEventListener('focus', load); };
  }, [signedIn]);
  return n;
}

function Bell({ count, label, active, onClick }: { count: number; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link href="/notifications" aria-label={count ? `${label} (${count})` : label} title={label} onClick={onClick}
      className={`relative hidden h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/5 sm:flex ${active ? 'text-ink' : 'text-muted hover:text-ink'}`}>
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

async function signOut(locale: string) {
  const { createClient } = await import('../../lib/supabase/client');
  // Local only: the default signs out every device, the app too (plan, fallgruve 22b).
  await createClient().auth.signOut({ scope: 'local' });
  window.location.assign(`/${locale}`);
}

// The TripShare logo: the app icon (brand/source/tripshare-icon-light-layered.svg, in public/).
// The same image is the logo on Google's sign-in screen, so it must look the same here.
export function LogoMark({ className = 'w-7 h-7', alt = '' }: { className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/tripshare-logo.svg" alt={alt} width={28} height={28} className={`${className} rounded-[22%]`} />;
}

function GlobeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function Nav({ active }: { active?: 'guides' | 'features' | 'support' | 'privacy' | 'terms' | 'myGuides' | 'login' | 'feed' | 'liked' | 'profile' | 'notifications' }) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const signedIn = useSignedIn();
  const unread = useUnread(signedIn);
  const webHref = signedIn ? '/my-guides' : WEB_APP_PATH;
  const webLabel = signedIn ? t('myGuides') : t('webApp');
  const webActive = active === (signedIn ? 'myGuides' : 'guides');
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  type Key = 'guides' | 'features' | 'support' | 'privacy' | 'feed' | 'liked' | 'profile' | 'notifications';
  const item = (key: Key) =>
    `hover:text-ink transition-colors hidden sm:block ${active === key ? 'text-ink' : ''}`;
  const mobileItem = (key: Key) =>
    `block px-4 py-3 rounded-xl text-sm transition-colors hover:bg-white/5 ${
      active === key ? 'text-ink font-semibold' : 'text-muted'
    }`;

  return (
    <nav ref={ref} className="fixed top-3 inset-x-3 sm:inset-x-6 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-bg/60 backdrop-blur-2xl px-4 sm:px-5 h-14 shadow-card">
        <Link href="/" className="flex items-center gap-2.5 font-display font-bold tracking-tight text-[15px]" onClick={() => setMenuOpen(false)}>
          <LogoMark />
          TripShare
        </Link>
        <div className="flex items-center gap-1 sm:gap-5 text-sm text-muted">
          {/* Signed in: the app's own pages instead of the product pages (those stay in the footer). */}
          {signedIn ? (
            <>
              <Link href="/feed" className={item('feed')}>{t('feed')}</Link>
              <Link href="/liked" className={item('liked')}>{t('liked')}</Link>
              <Link href="/profile" className={item('profile')}>{t('profile')}</Link>
            </>
          ) : (
            <>
              <Link href="/features" className={item('features')}>{t('features')}</Link>
              <Link href="/support" className={item('support')}>{t('support')}</Link>
              <Link href="/privacy" className={item('privacy')}>{t('privacy')}</Link>
            </>
          )}
          {signedIn && <Bell count={unread} label={t('notifications')} active={active === 'notifications'} />}
          <LangSwitcher />
          {signedIn ? (
            <button type="button" onClick={() => signOut(locale)} className="hidden sm:block hover:text-ink transition-colors">{t('logout')}</button>
          ) : (
            <Link href="/login" className={`hidden sm:block hover:text-ink transition-colors ${active === 'login' ? 'text-ink' : ''}`}>{t('login')}</Link>
          )}
          {/* The browser version, easy to find (Shane, 26.11.2026): a labelled button from sm, an icon on phones. */}
          <Link
            href={webHref}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              webActive ? 'border-accent bg-accent/15 text-ink' : 'border-accent/60 text-ink hover:bg-accent/15'
            }`}
          >
            <GlobeIcon className="h-3.5 w-3.5 text-accent" />
            {webLabel}
          </Link>
          <Link
            href={webHref}
            aria-label={webLabel}
            className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-accent/60 text-accent"
            onClick={() => setMenuOpen(false)}
          >
            <GlobeIcon className="h-4 w-4" />
          </Link>
          <a
            href="https://apps.apple.com/app/apple-store/id6778097653?pt=123110991&ct=tripshare.online&mt=8"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink text-bg text-xs font-semibold rounded-xl px-4 py-2 hover:bg-white transition-colors whitespace-nowrap"
          >
            {t('download')}
          </a>
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="relative sm:hidden p-2 -mr-1 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
          >
            {/* Phones: the bell lives in the menu; a dot here says there is something unread. */}
            {unread > 0 && !menuOpen && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />}
            {menuOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden max-w-5xl mx-auto mt-2 rounded-2xl border border-white/10 bg-bg/90 backdrop-blur-2xl shadow-card p-2">
          <Link href={webHref} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-ink bg-accent/15 border border-accent/40" onClick={() => setMenuOpen(false)}>
            <GlobeIcon className="h-4 w-4 text-accent" />
            {webLabel}
          </Link>
          {signedIn ? (
            <button type="button" onClick={() => signOut(locale)} className="block w-full text-left px-4 py-3 rounded-xl text-sm text-muted transition-colors hover:bg-white/5">{t('logout')}</button>
          ) : (
            <Link href="/login" className={`block px-4 py-3 rounded-xl text-sm transition-colors hover:bg-white/5 ${active === 'login' ? 'text-ink font-semibold' : 'text-muted'}`} onClick={() => setMenuOpen(false)}>{t('login')}</Link>
          )}
          {signedIn && (
            <>
              <Link href="/feed" className={mobileItem('feed')} onClick={() => setMenuOpen(false)}>{t('feed')}</Link>
              <Link href="/liked" className={mobileItem('liked')} onClick={() => setMenuOpen(false)}>{t('liked')}</Link>
              <Link href="/profile" className={mobileItem('profile')} onClick={() => setMenuOpen(false)}>{t('profile')}</Link>
              <Link href="/notifications" className={`${mobileItem('notifications')} flex items-center justify-between`} onClick={() => setMenuOpen(false)}>
                {t('notifications')}
                {unread > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">{unread}</span>}
              </Link>
            </>
          )}
          <Link href="/guides" className={mobileItem('guides')} onClick={() => setMenuOpen(false)}>{t('guides')}</Link>
          <Link href="/features" className={mobileItem('features')} onClick={() => setMenuOpen(false)}>{t('features')}</Link>
          <Link href="/support" className={mobileItem('support')} onClick={() => setMenuOpen(false)}>{t('support')}</Link>
          <Link href="/privacy" className={mobileItem('privacy')} onClick={() => setMenuOpen(false)}>{t('privacy')}</Link>
        </div>
      )}
    </nav>
  );
}
