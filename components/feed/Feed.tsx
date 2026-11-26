'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '../../lib/supabase/client';
import { ALL_TAGS, TAG_META } from '../../lib/core/guide';
import type { PublicGuide } from '../../lib/guides/model';
import { cardData, optionsByCount, langName, type Filters } from '../../lib/guides/discover';
import {
  loadFeedPage, searchGuidesServer, searchPeople, buildSections, searchFeed, readSeen, markSeen,
  type FeedProfile, type Person,
} from '../../lib/guides/feed';
import CardView from '../guide/CardView';
import LikeButton from '../guide/LikeButton';
import { myLikes } from '../../lib/guides/likes';
import FilterBar from '../guide/FilterBar';
import { Empty } from '../guide/GuideBrowser';

// The signed-in feed (plan F4.3–F4.5): the app's sections, search (guides + people) and
// filters, 20 guides per page with "Show more", read with the user's session.

type Props = {
  locale: string;
  me: string;
  profile: FeedProfile;
  initial: { guides: PublicGuide[]; hasMore: boolean; ok: boolean };
};

export default function Feed({ locale, me, profile, initial }: Props) {
  const home = useTranslations('app.home');
  const common = useTranslations('app.common');
  const tagT = useTranslations('app.tags');
  const share = useTranslations('share');
  const feed = useTranslations('feed');
  const myGuides = useTranslations('myGuides');
  const guideT = useTranslations('guide');

  const sb = useRef(createClient()).current;
  const [guides, setGuides] = useState(initial.guides);
  const [pageNo, setPageNo] = useState(0);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(!initial.ok);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ tags: [], lang: '', country: '' });
  const [open, setOpen] = useState(false);
  const [server, setServer] = useState<PublicGuide[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  useEffect(() => setSeen(readSeen()), []);
  const [likes, setLikes] = useState<Set<string> | null>(null); // null until loaded: ♥ waits for it
  useEffect(() => { myLikes(sb, me).then(setLikes); }, [sb, me]);
  const likeLabels = { like: guideT('like'), unlike: guideT('unlike'), signIn: guideT('likeSignIn') };
  // Keep the new state when a card is drawn again (search, "Show more", sections moving).
  function onLiked(id: string, liked: boolean, count: number) {
    setLikes(prev => { const next = new Set(prev ?? []); if (liked) next.add(id); else next.delete(id); return next; });
    const bump = (list: PublicGuide[]) => list.map(p => (p.guide.id === id ? { ...p, upvotes: count } : p));
    setGuides(bump);
    setServer(bump);
  }

  const tagText = (tag: string) => (tagT.has(tag) ? tagT(tag) : TAG_META[tag as keyof typeof TAG_META]?.label ?? tag);
  const tagLabels = useMemo(() => Object.fromEntries(ALL_TAGS.map(t => [t, tagT.has(t) ? tagT(t) : TAG_META[t].label])), [tagT]);
  const card = (p: PublicGuide) => cardData(p, {
    days: count => share('days', { count }),
    stops: count => share('stops', { count }),
    by: name => share('by', { name }),
  });

  // Server search for guides and people, 250 ms after typing (app H:448–488).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setServer([]); setPeople([]); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchGuidesServer(sb, q).then(r => { if (!cancelled) setServer(r); });
      searchPeople(sb, q, me, profile.blocked).then(r => { if (!cancelled) setPeople(r); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, sb, me, profile.blocked]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = pageNo + 1;
    const res = await loadFeedPage(sb, next);
    setLoadingMore(false);
    if (!res.ok) { setError(true); return; } // hasMore stays: can try again
    setError(false);
    setGuides(prev => {
      const ids = new Set(prev.map(p => p.guide.id));
      return [...prev, ...res.guides.filter(p => !ids.has(p.guide.id))];
    });
    setHasMore(res.hasMore);
    setPageNo(next);
  }

  // Filter options come from the loaded guides; their order is fixed while the panel is open.
  const langOptions = useMemo(() => optionsByCount(guides.map(p => (p.guide.language ? langName(p.guide.language) : '')), filters.lang),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guides, open]);
  const countryOptions = useMemo(() => optionsByCount(guides.map(p => p.guide.country ?? ''), filters.country),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guides, open]);

  const searching = !!query.trim();
  const active = filters.tags.length + (filters.lang ? 1 : 0) + (filters.country ? 1 : 0);
  const results = useMemo(() => (searching ? searchFeed(guides, server, query, profile, filters, tagText) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searching, guides, server, query, profile, filters]);
  const sections = useMemo(() => (searching ? [] : buildSections(guides, profile, seen, filters)), [searching, guides, profile, seen, filters]);
  const heading = { following: common('following'), forYou: home('forYou'), mostLoved: home('mostLoved'), discover: home('discover') };

  const grid = (list: PublicGuide[], badge?: string) => (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map(p => {
        const c = card(p);
        return (
          <div key={p.guide.id} className="relative">
            <CardView c={{ ...c, showCount: false }} badge={badge} onOpen={() => markSeen(p.guide.id)} />
            {c.showCount && (
              <div className="absolute right-3 top-3">
                <LikeButton variant="card" guideId={p.guide.id} authorId={p.authorId} count={p.upvotes} locale={locale}
                  me={me} liked={likes ? likes.has(p.guide.id) : undefined} labels={likeLabels} onChange={(liked, count) => onLiked(p.guide.id, liked, count)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{home('discoverGuides')}</h1>
      <div className="mt-8">
        <FilterBar
          query={query} onQuery={setQuery} filters={filters} onFilters={setFilters} open={open} onOpen={setOpen}
          langOptions={langOptions} countryOptions={countryOptions} tagLabels={tagLabels} locale={locale}
          labels={{
            search: home('searchPlaceholder'), filters: home('filters'), travelType: home('filterTravelType'),
            language: home('filterLanguage'), country: home('filterCountry'), reset: home('resetFilters'),
          }}
        />
      </div>
      {error && <p role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-300">{home('feedErrorBanner')}</p>}

      {searching ? (
        <div aria-live="polite">
          {people.length > 0 && (
            <section className="mt-10" data-section="people">
              <h2 className="font-display text-2xl font-bold">{home('people')}</h2>
              {/* Profiles open in phase 5; until then the names are not links. */}
              <ul className="mt-4 flex flex-wrap gap-3">
                {people.map(p => (
                  <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
                    {p.photo_url?.startsWith('https://') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{(p.name || '?').charAt(0).toUpperCase()}</span>
                    )}
                    <span className="text-sm font-semibold">{p.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.length > 0 ? (
            <section className="mt-10" data-section="results">
              <h2 className="font-display text-2xl font-bold">{common('guides')}</h2>
              {grid(results)}
            </section>
          ) : people.length === 0 && <Empty title={home('noGuidesFound')} text={home('tryDifferentSearch')} />}
        </div>
      ) : sections.length > 0 ? (
        <>
          {sections.map(s => (
            <section key={s.key} className="mt-12" data-section={s.key}>
              <h2 className="font-display text-2xl font-bold">{heading[s.key]}</h2>
              {grid(s.guides, s.key === 'following' ? common('following') : undefined)}
            </section>
          ))}
          {hasMore && (
            <div className="mt-12 text-center">
              <button type="button" onClick={loadMore} disabled={loadingMore}
                className="rounded-2xl border border-border px-6 py-3 text-sm font-semibold hover:bg-surface disabled:opacity-60">
                {loadingMore ? common('loading') : feed('showMore')}
              </button>
            </div>
          )}
        </>
      ) : active > 0 ? (
        <Empty title={home('noGuidesFound')} text={home('tryDifferentSearch')} />
      ) : (
        <Empty title={home('noGuidesYet')} text="">
          <a href={`/${locale}/my-guides/new`} className="mt-6 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent2">
            {myGuides('newGuide')}
          </a>
        </Empty>
      )}
    </main>
  );
}
