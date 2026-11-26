import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { renderUrl } from '../../lib/images';
import { type PublicGuide, daysWithStops, stopCount, displayAuthor, guideLocale, guidePath } from '../../lib/guides/model';

// A guide in a list (home page, /guides). Links straight to the canonical URL, so search engines
// don't crawl ten language copies of every guide.
export default async function GuideCard({ p, locale, priority = false }: { p: PublicGuide; locale: string; priority?: boolean }) {
  const g = p.guide;
  const t = await getTranslations({ locale, namespace: 'share' });
  const n = daysWithStops(g).length;
  return (
    <a href={guidePath(guideLocale(g), g)} className="group block overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
      {g.coverImage ? (
        <Image src={renderUrl(g.coverImage, 640, 420)} alt="" width={640} height={420} unoptimized priority={priority}
          sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex aspect-[3/2] w-full items-center justify-center bg-[#1A1A2E] font-display text-6xl font-bold text-white/80">
          {(g.destination || g.title || '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{[g.destination, g.country].filter(Boolean).join(', ')}</p>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug [text-wrap:balance]">{g.title}</h3>
        <p className="mt-2 text-sm text-faint">
          {[n > 0 ? t('days', { count: n }) : null, stopCount(g) > 0 ? t('stops', { count: stopCount(g) }) : null, t('by', { name: displayAuthor(p) })]
            .filter(Boolean).join(' · ')}
        </p>
      </div>
    </a>
  );
}
