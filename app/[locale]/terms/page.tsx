import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';
import Nav from '../Nav';
import { Link } from '../../i18n/navigation';

export const metadata: Metadata = {
  title: 'Terms of Use – TripShare',
};

export default function Terms() {
  const t = useTranslations('termsPage');
  const sections = t.raw('sections') as Array<{ title: string; body: string }>;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="terms" />

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-accent text-sm font-medium mb-3 tracking-wide uppercase">{t('badge')}</p>
          <h1 className="text-4xl font-bold mb-3">{t('heading')}</h1>
          <p className="text-gray-500 text-sm mb-12">{t('updated')}</p>

          <p className="text-gray-300 leading-relaxed mb-12">{t('intro')}</p>

          <div className="flex flex-col gap-10">
            {sections.map((s, i) => (
              <section key={s.title}>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/15 text-accent text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  {s.title}
                </h2>
                <p className="text-gray-400 leading-relaxed pl-9">{s.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-border">
            <p className="text-gray-500 text-sm">
              {t('questions')}{' '}
              <a href="mailto:support@tripshare.online" className="text-accent hover:underline">
                support@tripshare.online
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} {t('allRights')}</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">{t('privacyPolicy')}</Link>
            <Link href="/" className="hover:text-white transition-colors">{t('backHome')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
