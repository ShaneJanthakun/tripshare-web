import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import LikeButton from './LikeButton';
import FollowButton from '../social/FollowButton';
import PrintButton from './PrintButton';
import { TAG_META, type CustomSection, type GuideTag, type Stop } from '../../lib/core/guide';
import { renderUrl } from '../../lib/images';
import {
  type PublicGuide, daysWithStops, stopCount, displayAuthor, showsCounts, orderedBlocks,
  shortAddress, mapsLink, normalizeUrl, monetizeLink, dayColor,
} from '../../lib/guides/model';
import type { GuideMapData } from '../../lib/guides/mapdata';
import GuideMap from './GuideMap';

// A guide as the app shows it in reading mode (plan F1.3). Server component; the content is in
// the guide's own language, the labels in the page's language. Shared with the preview in phase 3.

const APP_STORE_URL = 'https://apps.apple.com/app/id6778097653';

type Props = {
  p: PublicGuide;
  locale: string;
  subtitle: string;
  miniMaps: Record<string, GuideMapData>;
};

type HeaderProps = { p: PublicGuide; locale: string; subtitle: string };

/** The card on top: cover, title, subtitle, tags, author line and app buttons. */
export async function GuideHeader({ p, locale, subtitle }: HeaderProps) {
  const g = p.guide;
  const t = await getTranslations({ locale });
  const n = daysWithStops(g).length;
  const stops = stopCount(g);
  const author = displayAuthor(p);
  const counts = showsCounts(p);
  const lang = (g.language ?? '').trim();
  const mapLabels = { all: t('guide.mapAll'), empty: t('app.guideDetail.addStopsToMap'), error: t('guide.mapError') };

  // Card: the design of the short-link page (Shane, 11.11.2026).
  return (
    <header className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
        {g.coverImage ? (
          <Image
            src={renderUrl(g.coverImage, 1600)}
            alt=""
            width={1600}
            height={1000}
            sizes="(min-width: 1024px) 680px, 100vw"
            unoptimized
            priority
            className="aspect-[16/10] w-full object-cover"
            style={{ objectPosition: `center ${g.coverImageOffset ?? 50}%` }}
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#1A1A2E] font-display text-8xl font-bold text-white/80">
            {(g.destination || g.title || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl [text-wrap:balance]">{g.title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>

          {g.tags?.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.tags.map(tag => (
                <li key={tag} className="rounded-full border border-border bg-s2 px-3 py-1 text-xs text-muted">
                  {TAG_META[tag as GuideTag]?.icon} {t.has(`app.tags.${tag}`) ? t(`app.tags.${tag}`) : TAG_META[tag as GuideTag]?.label ?? tag}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {/* Real users (not the team or seed authors) have a public profile (B9) and can be followed. */}
            {counts ? (
              <>
                <a href={`/${locale}/u/${encodeURIComponent(p.authorId)}`} className="group flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    {author.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-ink group-hover:underline">{author}</span>
                </a>
                <span className="print:hidden"><FollowButton userId={p.authorId} locale={locale}
                  labels={{ follow: t('app.common.follow'), following: t('app.common.following'), signIn: t('app.publicProfile.signInFollow') }} /></span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {author.charAt(0).toUpperCase()}
                </span>
                <span className="text-ink">{author}</span>
              </span>
            )}
            {n > 0 && <span>{t('share.days', { count: n })} · {t('share.stops', { count: stops })}</span>}
            {counts && <span>{t('guide.views', { count: p.views })}</span>}
            {counts && p.upvotes > 0 && <span className="hidden print:inline">♥ {p.upvotes}</span>}
            {counts && (
              <span className="print:hidden"><LikeButton guideId={g.id} authorId={p.authorId} count={p.upvotes} locale={locale}
                labels={{ like: t('guide.like'), unlike: t('guide.unlike'), signIn: t('guide.likeSignIn') }} /></span>
            )}
            {lang && <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">{lang}</span>}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
            <a href={`tripshare://guide/${encodeURIComponent(g.id)}`} className="rounded-xl bg-accent px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent2 lg:hidden">
              {t('share.openInApp')}
            </a>
            <a href={APP_STORE_URL} className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-s2">
              {t('share.getApp')}
            </a>
            <PrintButton label={t('app.guideDetail.downloadPdf')} />
          </div>
        </div>
    </header>
  );
}

/** Everything under the card: description, tips, days and sections in the guide's order, places. */
export async function GuideBody({ p, locale, miniMaps }: { p: PublicGuide; locale: string; miniMaps: Record<string, GuideMapData> }) {
  const g = p.guide;
  const t = await getTranslations({ locale });
  const n = daysWithStops(g).length;
  const stops = stopCount(g);
  const author = displayAuthor(p);
  const counts = showsCounts(p);
  const lang = (g.language ?? '').trim();
  const mapLabels = { all: t('guide.mapAll'), empty: t('app.guideDetail.addStopsToMap'), error: t('guide.mapError') };

  return (
    <div className="space-y-12">
        {g.description?.trim() && (
          <p className="whitespace-pre-line text-[17px] leading-relaxed text-ink/90">{g.description.trim()}</p>
        )}

        {(g.generalTips ?? []).filter(Boolean).length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold">{t('app.guideDetail.generalTips')}</h2>
            <ul className="mt-4 space-y-2.5">
              {g.generalTips.filter(Boolean).map((tip, i) => (
                <li key={i} className="flex gap-3 leading-relaxed text-ink/90">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {orderedBlocks(g).map(block =>
          block.kind === 'day' ? (
            <section key={block.day.id} id={`day-${block.index + 1}`}>
              <h2 className="flex items-center gap-3 font-display text-2xl font-bold">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: dayColor(block.index) }} />
                {block.day.label}
              </h2>
              {(block.day.stops ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-faint">{t('app.guideDetail.noStopsYet')}</p>
              ) : (
                <ol className="mt-5 space-y-6 border-l border-border pl-6">
                  {block.day.stops.map((s, i) => <StopItem key={s.id ?? i} stop={s} n={i + 1} color={dayColor(block.index)} g={g} />)}
                </ol>
              )}
            </section>
          ) : (
            <SectionBlock key={block.section.id} s={block.section} g={g} t={t} mini={miniMaps[block.section.id]} mapLabels={mapLabels} />
          ),
        )}

        {(g.placesToVisit ?? []).length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold">{t('app.guideDetail.placesToVisit')}</h2>
            <ul className="mt-5 space-y-5">
              {g.placesToVisit.map((s, i) => <StopItem key={s.id ?? i} stop={s} g={g} />)}
            </ul>
          </section>
        )}
      </div>
  );
}

/** Header and body together, without the guide map (used by the editor preview in phase 3). */
export default async function GuideView({ p, locale, subtitle, miniMaps }: Props) {
  return (
    <article>
      <GuideHeader p={p} locale={locale} subtitle={subtitle} />
      <div className="mt-10"><GuideBody p={p} locale={locale} miniMaps={miniMaps} /></div>
    </article>
  );
}

function StopItem({ stop, n, color, g }: { stop: Stop; n?: number; color?: string; g: PublicGuide['guide'] }) {
  const images = (stop.images ?? []).filter(u => u.startsWith('https://'));
  return (
    <li className="relative">
      {n !== undefined && (
        <span
          className="absolute -left-[37px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg text-[11px] font-bold text-white"
          style={{ background: color }}
        >
          {n}
        </span>
      )}
      <h3 className="font-semibold leading-snug">
        {stop.address?.trim() ? (
          <a href={mapsLink(stop.address, g)} target="_blank" rel="noopener noreferrer" className="decoration-accent/50 underline-offset-4 hover:underline">
            {stop.name || shortAddress(stop.address)}
          </a>
        ) : stop.name}
      </h3>
      {stop.address?.trim() && <p className="mt-0.5 text-sm text-faint">{shortAddress(stop.address)}</p>}
      {stop.notes?.trim() && <p className="mt-2 whitespace-pre-line italic leading-relaxed text-ink/80">{stop.notes.trim()}</p>}
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((u, i) => (
            <Image key={i} src={renderUrl(u, 280, 180)} alt="" width={140} height={90} unoptimized className="h-[90px] w-[140px] rounded-lg object-cover" />
          ))}
        </div>
      )}
    </li>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;
const TYPE_LABEL: Record<string, string> = {
  list: 'sectionTypeList', checklist: 'sectionTypeList', note: 'sectionTypeNote', gallery: 'sectionTypeGallery',
  map: 'sectionTypeMap', accommodation: 'sectionTypeAccommodation',
};

function SectionBlock({ s, g, t, mini, mapLabels }: {
  s: CustomSection; g: PublicGuide['guide']; t: T; mini?: GuideMapData; mapLabels: { all: string; empty: string; error: string };
}) {
  const heading = s.title?.trim() || t(`app.guideDetail.${TYPE_LABEL[s.type] ?? 'sectionTypeList'}`);
  const images = (s.images ?? []).filter(u => u.startsWith('https://'));

  if (s.type === 'gallery') {
    if (images.length === 0) return null;
    return (
      <section>
        <h2 className="font-display text-2xl font-bold">{heading}</h2>
        <div className={`mt-5 grid gap-3 ${images.length > 1 ? 'grid-cols-2' : ''}`}>
          {images.map((u, i) => (
            <Image key={i} src={renderUrl(u, images.length > 1 ? 500 : 800)} alt="" width={800} height={600} unoptimized
              sizes={images.length > 1 ? '(min-width: 1024px) 340px, 50vw' : '(min-width: 1024px) 680px, 100vw'}
              className="aspect-[4/3] w-full rounded-xl object-cover" />
          ))}
        </div>
      </section>
    );
  }

  if (s.type === 'accommodation') {
    const name = s.accommodationName?.trim() || s.title?.trim() || heading;
    const pics = images.length ? images : (s.accommodationImage?.startsWith('https://') ? [s.accommodationImage] : []);
    const url = normalizeUrl(s.accommodationUrl ?? '');
    return (
      <section className="rounded-3xl border border-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">{t('app.guideDetail.accommodation')}</p>
        <h2 className="mt-1 font-display text-2xl font-bold">{name}</h2>
        {s.note?.trim() && <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/90">{s.note.trim()}</p>}
        {pics.length > 0 && <PhotoGrid images={pics} />}
        {url && (
          <a href={monetizeLink(url)} target="_blank" rel="nofollow sponsored noopener noreferrer"
            className="mt-5 inline-block rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            {t('app.guideDetail.bookNow')}
          </a>
        )}
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-bold">{heading}</h2>
      {s.type === 'note' && (
        <>
          {s.note?.trim() && <p className="mt-4 whitespace-pre-line leading-relaxed text-ink/90">{s.note.trim()}</p>}
          {images.length > 0 && <PhotoGrid images={images.slice(0, 5)} />}
        </>
      )}
      {s.type === 'list' && (
        <ul className="mt-4 space-y-2.5">
          {(s.items ?? []).filter(Boolean).map((item, i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-ink/90">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {s.type === 'checklist' && (
        <ul className="mt-4 space-y-2">
          {(s.checklistItems ?? []).map(c => (
            <li key={c.id} className="flex items-center gap-3 text-ink/90">
              <span aria-hidden className={`flex h-5 w-5 items-center justify-center rounded border ${c.checked ? 'border-accent bg-accent text-white' : 'border-border'}`}>
                {c.checked ? '✓' : ''}
              </span>
              <span className={c.checked ? 'text-muted line-through' : ''}>{c.text}</span>
            </li>
          ))}
        </ul>
      )}
      {s.type === 'map' && (
        <>
          <ol className="mt-4 space-y-1.5">
            {(s.items ?? []).map((item, i) => (
              <li key={i} className="flex gap-3 text-ink/90">
                <span className="font-semibold text-accent">{i + 1}.</span>
                <span>{String(item).split('|||')[0]}</span>
              </li>
            ))}
          </ol>
          {mini && <div className="mt-4"><GuideMap data={mini} mini labels={mapLabels} /></div>}
        </>
      )}
    </section>
  );
}

function PhotoGrid({ images }: { images: string[] }) {
  if (images.length >= 3) {
    return (
      <div className="mt-4 grid grid-cols-3 grid-rows-2 gap-2">
        <Image src={renderUrl(images[0], 700)} alt="" width={700} height={500} unoptimized className="col-span-2 row-span-2 h-full w-full rounded-xl object-cover" />
        <Image src={renderUrl(images[1], 340)} alt="" width={340} height={240} unoptimized className="aspect-[4/3] w-full rounded-xl object-cover" />
        <div className="relative">
          <Image src={renderUrl(images[2], 340)} alt="" width={340} height={240} unoptimized className="aspect-[4/3] w-full rounded-xl object-cover" />
          {images.length > 3 && (
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 font-display text-xl font-bold">+{images.length - 3}</span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={`mt-4 grid gap-2 ${images.length > 1 ? 'grid-cols-2' : ''}`}>
      {images.map((u, i) => (
        <Image key={i} src={renderUrl(u, 600)} alt="" width={600} height={450} unoptimized className="aspect-[4/3] w-full rounded-xl object-cover" />
      ))}
    </div>
  );
}
