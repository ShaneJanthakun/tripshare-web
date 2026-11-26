import Image from 'next/image';
import { renderUrl } from '../../lib/images';
import type { CardData } from '../../lib/guides/discover';

// A guide card, shared by the static lists (GuideCard) and the search on /guides (client).
// Links straight to the canonical URL, so search engines don't crawl ten copies of each guide.
// ♥ is left out on team guides, as in the app (H:35–37, 315).
export default function CardView({ c, priority = false }: { c: CardData; priority?: boolean }) {
  return (
    <a href={c.href} className="group block overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
      {c.cover ? (
        <Image src={renderUrl(c.cover, 640, 420)} alt="" width={640} height={420} unoptimized priority={priority}
          sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex aspect-[3/2] w-full items-center justify-center bg-[#1A1A2E] font-display text-6xl font-bold text-white/80">
          {c.initial}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{c.place}</p>
          {c.showCount && c.upvotes > 0 && (
            <span className="shrink-0 text-xs font-semibold text-muted" aria-label={`♥ ${c.upvotes}`}>♥ {c.upvotes}</span>
          )}
        </div>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug [text-wrap:balance]">{c.title}</h3>
        <p className="mt-2 text-sm text-faint">{c.meta}</p>
      </div>
    </a>
  );
}
