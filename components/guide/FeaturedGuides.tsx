import { getTranslations } from 'next-intl/server';
import { Link } from '../../app/i18n/navigation';
import GuideCard from './GuideCard';
import { loadPublicGuides } from '../../lib/guides/queries';
import { isThin, wordCount } from '../../lib/guides/model';

// "Featured itineraries" on the home page (F1.9): chosen by search demand, not likes
// (12-seo.md § 3, rule 7) — the strongest guide for each city.
const CITIES = ['Paris', 'New York', 'London', 'Rome', 'Tokyo', 'Mexico City'];

export default async function FeaturedGuides({ locale }: { locale: string }) {
  const [guides, t] = await Promise.all([loadPublicGuides(), getTranslations({ locale, namespace: 'featured' })]);
  const picks = CITIES.flatMap(city => {
    const best = guides
      .filter(p => p.guide.destination?.trim().toLowerCase() === city.toLowerCase() && !isThin(p.guide))
      .sort((a, b) => wordCount(b.guide) - wordCount(a.guide))[0];
    return best ? [best] : [];
  });
  if (picks.length === 0) return null;
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-5xl [text-wrap:balance]">{t('title')}</h2>
        <p className="mx-auto mb-12 mt-4 max-w-md text-center text-sm text-muted">{t('sub')}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map(p => <GuideCard key={p.guide.id} p={p} locale={locale} />)}
        </div>
        <div className="mt-12 text-center">
          <Link href="/guides" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-ink">
            {t('seeAll')} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
