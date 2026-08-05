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
  const item = (key: 'features' | 'support' | 'privacy') =>
    `hover:text-ink transition-colors hidden sm:block ${active === key ? 'text-ink' : ''}`;

  return (
    <nav className="fixed top-3 inset-x-3 sm:inset-x-6 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-bg/60 backdrop-blur-2xl px-4 sm:px-5 h-14 shadow-card">
        <Link href="/" className="flex items-center gap-2.5 font-display font-bold tracking-tight text-[15px]">
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
        </div>
      </div>
    </nav>
  );
}
