import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../Nav';
import Footer from '../Footer';
import GuideCard, { toCard } from '../../../components/guide/GuideCard';
import GuideBrowser from '../../../components/guide/GuideBrowser';
import LandingLinks from '../../../components/guide/LandingLinks';
import { loadPublicGuides } from '../../../lib/guides/queries';
import { ALL_TAGS } from '../../../lib/core/guide';
import { localizedMetadata } from '../../seo';

// All published public guides (F1.11, moved from F4.1): "Most loved" and "Newest", with the
// app's search and filter (F4.4–F4.5) and links to the landing pages (F4.2). Static, ISR 10 min.
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata(locale, 'guides');
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'guidesPage' });
  const guides = await loadPublicGuides();
  const loved = [...guides].filter(p => p.upvotes > 0).sort((a, b) => b.upvotes - a.upvotes).slice(0, 6);
  const cards = await Promise.all(guides.map(p => toCard(p, locale)));
  const home = await getTranslations({ locale, namespace: 'app.home' });
  const tagT = await getTranslations({ locale, namespace: 'app.tags' });
  const tagLabels = Object.fromEntries(ALL_TAGS.filter(k => tagT.has(k)).map(k => [k, tagT(k)]));
  const labels = {
    search: t('search'),
    filters: home('filters'),
    travelType: home('filterTravelType'),
    language: home('filterLanguage'),
    country: home('filterCountry'),
    reset: home('resetFilters'),
    noneTitle: home('noGuidesFound'),
    noneText: home('tryDifferentSearch'),
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="guides" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{t('heading')}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{t('intro')}</p>
          <p className="mt-3 text-sm text-faint">{t('count', { count: guides.length })}</p>
        </header>

        <GuideBrowser cards={cards} locale={locale} labels={labels} tagLabels={tagLabels}
          resultsLabel={{ one: t('resultsOne'), other: t('resultsMany') }}>
          {loved.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl font-bold">{t('mostLoved')}</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {loved.map((p, i) => <GuideCard key={p.guide.id} p={p} locale={locale} priority={i < 3} />)}
              </div>
            </section>
          )}

          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold">{t('newest')}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map(p => <GuideCard key={p.guide.id} p={p} locale={locale} />)}
            </div>
          </section>
        </GuideBrowser>

        <LandingLinks locale={locale} guides={guides} />
      </main>
      <Footer />
    </div>
  );
}
