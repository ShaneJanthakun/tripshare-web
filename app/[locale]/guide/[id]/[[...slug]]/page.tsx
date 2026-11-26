import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../../Nav';
import Footer from '../../../Footer';
import { Link } from '../../../../i18n/navigation';
import { GuideHeader, GuideBody } from '../../../../../components/guide/GuideView';
import GuideMap from '../../../../../components/guide/GuideMap';
import Comments from '../../../../../components/social/Comments';
import { loadPublicGuide, loadPublicGuides } from '../../../../../lib/guides/queries';
import { buildGuideMap, buildMiniMap, type GuideMapData } from '../../../../../lib/guides/mapdata';
import {
  type PublicGuide, daysWithStops, stopCount, guideLocale, guideSlug, guidePath, isThin, seoTitle, excerpt, displayAuthor,
} from '../../../../../lib/guides/model';
import { renderUrl } from '../../../../../lib/images';
import { SITE_URL, OG_IMAGE } from '../../../../seo';

// Public guide page (plan F1.2–F1.5): static, rebuilt at most every 10 minutes (ISR).
// Canonical URL: /{guide's language}/guide/{id}/{slug}. Other languages can be visited and point
// to the canonical one. Drafts and private guides give 404; a wrong slug redirects (308).
export const revalidate = 600;
export const dynamicParams = true;

type Params = { locale: string; id: string; slug?: string[] };

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const guides = await loadPublicGuides();
  const out = guides
    .filter(p => guideLocale(p.guide) === params.locale)
    .map(p => ({ id: p.guide.id, slug: [guideSlug(p.guide)] }));
  // Next 15.5 drops prerendering for the whole route when any language returns no params (the
  // language is then passed on without an id). A placeholder that 404s keeps every language
  // complete; nothing links to it.
  return out.length ? out : [{ id: '_', slug: ['_'] }];
}

/** Title, subtitle and description in the guide's own language (12-seo.md § 3). */
async function seoTexts(p: PublicGuide) {
  const g = p.guide;
  const tm = await getTranslations({ locale: guideLocale(g), namespace: 'meta' });
  const days = daysWithStops(g).length;
  const where = [g.destination, g.country].map(s => s?.trim()).filter(Boolean).join(', ');
  const title = seoTitle(
    g,
    short => tm('guideTitle', { destination: g.destination, days, title: short }),
    g.destination?.trim() && !g.title.toLowerCase().includes(g.destination.trim().toLowerCase())
      ? tm('guideTitleNoDays', { title: g.title, destination: g.destination })
      : g.title,
  );
  const lead = days > 0 ? tm('guideLead', { days, destination: g.destination }) : '';
  const subtitle = days > 0 ? [lead, g.country?.trim()].filter(Boolean).join(' · ') : where;
  const description = excerpt(
    g.description?.trim()
      ? [lead && `${lead}.`, g.description.trim()].filter(Boolean).join(' ')
      : tm('guideFallback', { days: Math.max(days, 1), destination: g.destination || g.title, stops: stopCount(g) }),
    155,
  );
  return { title, subtitle, description };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const p = await loadPublicGuide(id);
  if (!p) return { robots: { index: false, follow: false } };
  const g = p.guide;
  const { title, description } = await seoTexts(p);
  const canonical = SITE_URL + guidePath(guideLocale(g), g);
  const image = g.coverImage
    ? { url: renderUrl(g.coverImage, 1200, 630, 80), width: 1200, height: 630, alt: g.title }
    : OG_IMAGE;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    // Thin guides: noindex, follow, and out of the sitemap (12-seo.md § 3, rule 5).
    robots: isThin(g) ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, url: canonical, type: 'article', siteName: 'TripShare', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

function jsonLd(p: PublicGuide, description: string) {
  const g = p.guide;
  const stops = (g.days ?? []).flatMap(d => d.stops ?? []).filter(s => s.name?.trim());
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: g.title,
    description,
    url: SITE_URL + guidePath(guideLocale(g), g),
    ...(g.coverImage ? { image: renderUrl(g.coverImage, 1200, 630, 80) } : {}),
    inLanguage: guideLocale(g),
    author: { '@type': displayAuthor(p) === 'TripShare Team' ? 'Organization' : 'Person', name: displayAuthor(p) },
    provider: { '@type': 'Organization', name: 'TripShare', url: SITE_URL },
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: stops.length,
      itemListElement: stops.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'TouristAttraction', name: s.name, ...(s.address?.trim() ? { address: s.address.trim() } : {}) },
      })),
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { locale, id, slug } = await params;
  setRequestLocale(locale);
  const p = await loadPublicGuide(id);
  if (!p) notFound();
  const g = p.guide;
  if (slug?.length !== 1 || slug[0] !== guideSlug(g)) permanentRedirect(guidePath(locale, g));

  const t = await getTranslations({ locale });
  const [{ subtitle, description }, map, minis] = await Promise.all([
    seoTexts(p),
    buildGuideMap(g),
    Promise.all((g.customSections ?? []).filter(s => s.type === 'map').map(async s => {
      const mini = await buildMiniMap(s.items ?? [], g);
      return [s.id, { ...mini, lines: [], groups: [], missing: 0 }] as [string, GuideMapData];
    })),
  ]);
  const mapLabels = { all: t('guide.mapAll'), empty: t('app.guideDetail.addStopsToMap'), error: t('guide.mapError') };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(p, description)).replace(/</g, '\\u003c') }} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6">
        <Link href="/guides" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
          <span aria-hidden>←</span> {t('guide.allGuides')}
        </Link>
        {/* PC: content left, map right and sticky. Phone: card, map, then content. */}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <GuideHeader p={p} locale={locale} subtitle={subtitle} />
          </div>
          <aside className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1" aria-label={t('app.guideDetail.map')}>
            <div className="lg:sticky lg:top-24">
              <GuideMap data={map} labels={mapLabels} />
            </div>
          </aside>
          <div className="lg:col-span-7">
            <GuideBody p={p} locale={locale} miniMaps={Object.fromEntries(minis)} />
            {!g.commentsDisabled && (
              <Comments guideId={g.id} ownerId={p.authorId} locale={locale} labels={{
                title: t('app.guideDetail.comments'), signInToRead: t('social.signInToRead'), signIn: t('app.common.signIn'),
                loading: t('app.common.loading'), placeholder: t('app.guideDetail.addComment'), post: t('app.guideDetail.postComment'),
                none: t('app.guideDetail.noComments'), noneSub: t('app.guideDetail.noCommentsSub'), already: t('app.guideDetail.alreadyCommented'),
                edit: t('app.guideDetail.editComment'), del: t('app.common.delete'), deleteConfirm: t('app.guideDetail.deleteCommentConfirm'),
                save: t('app.common.save'), cancel: t('app.common.cancel'), moderate: t('app.guideDetail.moderate'),
                deleteAction: t('app.guideDetail.deleteCommentAction'), blockTitle: t.raw('app.guideDetail.blockUserTitle') as string,
                blockConfirm: t('app.guideDetail.blockUserConfirm'), failed: t('app.guideDetail.commentFailed'), editFailed: t('app.guideDetail.commentEditFailed'),
              }} />
            )}
            <section className="mt-16 rounded-3xl border border-border bg-gradient-to-b from-s2 to-surface p-8 text-center">
              <h2 className="font-display text-2xl font-bold">{t('guide.ctaTitle')}</h2>
              <p className="mx-auto mt-3 max-w-md text-muted">{t('guide.ctaText')}</p>
              <a href="https://apps.apple.com/app/id6778097653" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent2">
                {t('guide.makeYourOwn')}
              </a>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
