import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';
import Nav from '../Nav';
import Footer from '../Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy – TripShare',
};

export default function Privacy() {
  const t = useTranslations('privacyPage');
  const sections = t.raw('sections') as Array<{ title: string; body: string }>;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="privacy" />

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-accent text-xs font-semibold mb-3 tracking-[0.25em] uppercase">{t('badge')}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3 tracking-tight">{t('heading')}</h1>
          <p className="text-gray-500 text-sm mb-12">{t('updated')}</p>

          <p className="text-gray-300 leading-relaxed mb-12">{t('intro')}</p>

          <div className="flex flex-col gap-10">
            {sections.map((s, i) => (
              <section key={s.title}>
                <h2 className="font-display text-lg font-semibold text-ink mb-3 flex items-center gap-3">
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

      <Footer />
    </div>
  );
}
