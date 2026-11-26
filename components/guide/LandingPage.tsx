import { getTranslations } from 'next-intl/server';
import Nav from '../../app/[locale]/Nav';
import Footer from '../../app/[locale]/Footer';
import { Link } from '../../app/i18n/navigation';
import { url, SITE_URL } from '../../app/seo';
import { type PublicGuide, guideLocale, guidePath } from '../../lib/guides/model';
import GuideCard from './GuideCard';
import LandingLinks from './LandingLinks';

// A landing page for a destination or travel type (plan F4.2): static, the guides most loved
// first and then newest, links to the other landing pages, and an ItemList for search engines.
export default async function LandingPage({ locale, all, list, heading, intro, current, path }: {
  locale: string; all: PublicGuide[]; list: PublicGuide[]; heading: string; intro: string; current: string; path: string;
}) {
  const t = await getTranslations({ locale, namespace: 'guide' });
  const sorted = [...list].sort((a, b) => b.upvotes - a.upvotes || b.createdAt.localeCompare(a.createdAt));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: heading,
    description: intro,
    url: url(locale, path),
    inLanguage: locale,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: sorted.length,
      itemListElement: sorted.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${guideHref(p)}`, name: p.guide.title })),
    },
  };
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="guides" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6">
        <Link href="/guides" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
          <span aria-hidden>←</span> {t('allGuides')}
        </Link>
        <header className="max-w-2xl">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl [text-wrap:balance]">{heading}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>
        </header>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p, i) => <GuideCard key={p.guide.id} p={p} locale={locale} priority={i < 3} />)}
        </div>
        <LandingLinks locale={locale} guides={all} current={current} more />
      </main>
      <Footer />
    </div>
  );
}

const guideHref = (p: PublicGuide) => guidePath(guideLocale(p.guide), p.guide);
