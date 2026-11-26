import { getTranslations } from 'next-intl/server';
import { Link } from '../../app/i18n/navigation';
import type { PublicGuide } from '../../lib/guides/model';
import { landingCountries, landingTags, countryLabel } from '../../lib/guides/discover';

// Links to every landing page (destinations and travel types), on /guides and on the landing
// pages themselves: crawlers find them, and visitors can jump between them.
export default async function LandingLinks({ locale, guides, current, more = false }: {
  locale: string; guides: PublicGuide[]; current?: string; more?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'guidesPage' });
  const tagT = await getTranslations({ locale, namespace: 'app.tags' });
  const countries = landingCountries(guides);
  const tags = landingTags(guides);
  const chip = (on: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? 'border-accent bg-accent/15 text-ink' : 'border-border text-muted hover:border-accent/50 hover:text-ink'}`;
  return (
    <section className="mt-16 grid gap-10 lg:grid-cols-2">
      {countries.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold">{more ? t('moreCountries') : t('countries')}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {countries.map(c => (
              <Link key={c.slug} href={`/guides/country/${c.slug}`} className={chip(current === `country/${c.slug}`)}>
                {countryLabel(c.name, locale)} <span className="text-xs text-faint">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {tags.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold">{more ? t('moreTypes') : t('travelTypes')}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map(x => (
              <Link key={x.slug} href={`/guides/tag/${x.slug}`} className={chip(current === `tag/${x.slug}`)}>
                {tagT.has(x.tag) ? tagT(x.tag) : x.tag} <span className="text-xs text-faint">{x.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
