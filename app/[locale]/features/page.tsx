import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';
import Nav from '../Nav';
import Footer from '../Footer';
import { Link } from '../../i18n/navigation';

export const metadata: Metadata = {
  title: 'Features – TripShare',
  description: 'Everything TripShare can do — from day-by-day itineraries to private guides with access codes.',
};

const ICONS = [
  <svg key="0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  <svg key="5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  <svg key="6" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  <svg key="7" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  <svg key="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  <svg key="9" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  <svg key="10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
];

export default function Features() {
  const t = useTranslations('featuresPage');
  const sections = t.raw('sections') as Array<{ title: string; desc: string; items: string[] }>;

  return (
    <div className="min-h-screen flex flex-col bg-bg text-white">
      <Nav active="features" />

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-accent text-xs font-semibold mb-3 tracking-[0.25em] uppercase">{t('badge')}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 tracking-tight">{t('heading')}</h1>
          <p className="text-muted mb-16 text-base leading-relaxed max-w-xl">{t('sub')}</p>

          <div className="flex flex-col gap-10">
            {sections.map((s, i) => (
              <section key={s.title} className="bg-surface border border-border rounded-3xl p-6 sm:p-8 transition-colors hover:border-accent/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    {ICONS[i]}
                  </div>
                  <h2 className="font-display text-base font-bold text-ink">{s.title}</h2>
                </div>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed pl-11">{s.desc}</p>
                <ul className="space-y-2.5 pl-11">
                  {s.items.map((item: string) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              {t('missing')}{' '}
              <a href="mailto:support@tripshare.online" className="text-accent hover:underline">
                support@tripshare.online
              </a>
            </p>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1">
              {t('backHome')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
