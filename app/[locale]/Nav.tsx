'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../i18n/navigation';
import LangSwitcher from './LangSwitcher';

export function LogoMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#FF5C38" />
      <path d="M16 8c-3.6 0-6.5 2.85-6.5 6.36 0 4.77 5.7 9.14 6.26 9.56a.4.4 0 0 0 .48 0c.56-.42 6.26-4.79 6.26-9.56C22.5 10.85 19.6 8 16 8Z" fill="#fff" />
      <circle cx="16" cy="14.2" r="2.3" fill="#FF5C38" />
    </svg>
  );
}

export default function Nav({ active }: { active?: 'features' | 'support' | 'privacy' | 'terms' }) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const item = (key: 'features' | 'support' | 'privacy') =>
    `hover:text-ink transition-colors hidden sm:block ${active === key ? 'text-ink' : ''}`;
  const mobileItem = (key: 'features' | 'support' | 'privacy') =>
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
          <Link href="/features" className={item('features')}>{t('features')}</Link>
          <Link href="/support" className={item('support')}>{t('support')}</Link>
          <Link href="/privacy" className={item('privacy')}>{t('privacy')}</Link>
          <LangSwitcher />
          <a
            href="https://apps.apple.com/app/id6778097653"
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
            className="sm:hidden p-2 -mr-1 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
          >
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
          <Link href="/features" className={mobileItem('features')} onClick={() => setMenuOpen(false)}>{t('features')}</Link>
          <Link href="/support" className={mobileItem('support')} onClick={() => setMenuOpen(false)}>{t('support')}</Link>
          <Link href="/privacy" className={mobileItem('privacy')} onClick={() => setMenuOpen(false)}>{t('privacy')}</Link>
        </div>
      )}
    </nav>
  );
}
