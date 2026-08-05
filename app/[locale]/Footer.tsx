import { useTranslations } from 'next-intl';
import { Link } from '../i18n/navigation';
import { LogoMark } from './Nav';

export default function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="relative border-t border-border py-10 px-6 mt-auto">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-sm text-muted">
        <div className="flex items-center gap-3">
          <LogoMark className="w-5 h-5" />
          <div className="flex flex-col items-center sm:items-start">
            <span>© {new Date().getFullYear()} TripShare</span>
            <span className="text-xs text-faint">{t('org')}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/features" className="hover:text-ink transition-colors">{t('features')}</Link>
          <Link href="/privacy" className="hover:text-ink transition-colors">{t('privacy')}</Link>
          <Link href="/terms" className="hover:text-ink transition-colors">{t('terms')}</Link>
          <Link href="/support" className="hover:text-ink transition-colors">{t('support')}</Link>
        </div>
      </div>
    </footer>
  );
}
