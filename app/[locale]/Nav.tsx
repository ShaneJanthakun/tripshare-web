import { useTranslations } from 'next-intl';
import { Link } from '../i18n/navigation';
import LangSwitcher from './LangSwitcher';

export default function Nav({ active }: { active?: 'features' | 'support' | 'privacy' | 'terms' }) {
  const t = useTranslations('nav');
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-bold tracking-tight">TripShare</Link>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <Link href="/features" className={`hover:text-white transition-colors hidden sm:block ${active === 'features' ? 'text-white' : ''}`}>{t('features')}</Link>
          <Link href="/support" className={`hover:text-white transition-colors hidden sm:block ${active === 'support' ? 'text-white' : ''}`}>{t('support')}</Link>
          <Link href="/privacy" className={`hover:text-white transition-colors hidden sm:block ${active === 'privacy' ? 'text-white' : ''}`}>{t('privacy')}</Link>
          <LangSwitcher />
          <a href="https://apps.apple.com/app/id6778097653" target="_blank" rel="noopener noreferrer" className="bg-white text-black text-xs font-semibold rounded-xl px-4 py-2 hover:bg-gray-100 transition-colors">
            {t('download')}
          </a>
        </div>
      </div>
    </nav>
  );
}
