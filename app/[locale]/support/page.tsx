import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';
import Nav from '../Nav';
import Footer from '../Footer';

export const metadata: Metadata = {
  title: 'Support – TripShare',
};

export default function Support() {
  const t = useTranslations('supportPage');
  const faq = t.raw('faq') as Array<{ q: string; a: string }>;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="support" />

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-accent text-xs font-semibold mb-3 tracking-[0.25em] uppercase">{t('badge')}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3 tracking-tight">{t('heading')}</h1>
          <p className="text-muted mb-12 text-lg leading-relaxed">{t('sub')}</p>

          <a
            href="mailto:support@tripshare.online"
            className="flex items-center gap-4 bg-surface border border-border hover:border-accent/50 rounded-2xl p-5 mb-16 transition-colors group"
          >
            <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">{t('emailLabel')}</p>
              <p className="text-sm text-accent">support@tripshare.online</p>
            </div>
            <svg className="w-4 h-4 text-gray-600 ml-auto group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>

          <h2 className="font-display text-2xl font-bold mb-8 tracking-tight">{t('faqHeading')}</h2>
          <div className="flex flex-col gap-px rounded-2xl overflow-hidden border border-border">
            {faq.map((item, i) => (
              <details key={i} className="bg-surface group">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium hover:text-white transition-colors list-none">
                  {item.q}
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
