'use client';

import { useEffect, useMemo, useState } from 'react';
import { ALL_TAGS, TAG_META } from '../../lib/core/guide';
import { searchCards, filterCards, optionsByCount, type CardData, type Filters } from '../../lib/guides/discover';
import CardView from './CardView';
import FilterBar, { type FilterLabels } from './FilterBar';

// Search and filter on /guides (plan F4.4–F4.5), with the app's rules: search on place, title and
// travel type, ranked like the app; travel types OR'ed, language and country exact, AND'ed.
// The choices live in the URL (?q=…&tag=foodie&lang=English&country=Italy), so they can be shared.
// With nothing chosen, the static sections (children) are shown, so crawlers see every guide.

export type BrowserLabels = FilterLabels & { noneTitle: string; noneText: string };

type Props = {
  cards: CardData[];
  locale: string;
  labels: BrowserLabels;
  resultsLabel: { one: string; other: string };
  tagLabels: Record<string, string>;
  children: React.ReactNode;
};

const readUrl = (p: URLSearchParams): Filters & { q: string } => ({
  q: p.get('q') ?? '',
  tags: (p.get('tag') ?? '').split(',').filter(t => (ALL_TAGS as string[]).includes(t)),
  lang: p.get('lang') ?? '',
  country: p.get('country') ?? '',
});

export default function GuideBrowser({ cards, locale, labels, resultsLabel, tagLabels, children }: Props) {
  // The page is static: the first render shows the plain lists, then the URL's choices are read.
  const [state, setState] = useState<Filters & { q: string }>({ q: '', tags: [], lang: '', country: '' });
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const fromUrl = readUrl(new URLSearchParams(window.location.search));
    setState(fromUrl);
    setOpen(fromUrl.tags.length > 0 || !!fromUrl.lang || !!fromUrl.country);
    setReady(true);
  }, []);

  // Keep the URL in step without a navigation.
  useEffect(() => {
    if (!ready) return;
    const qs = new URLSearchParams();
    if (state.q.trim()) qs.set('q', state.q.trim());
    if (state.tags.length) qs.set('tag', state.tags.join(','));
    if (state.lang) qs.set('lang', state.lang);
    if (state.country) qs.set('country', state.country);
    const next = `${window.location.pathname}${qs.size ? `?${qs}` : ''}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, '', next);
  }, [state, ready]);

  const active = state.tags.length + (state.lang ? 1 : 0) + (state.country ? 1 : 0);
  const searching = !!state.q.trim() || active > 0;
  const tagText = (tag: string) => tagLabels[tag] ?? TAG_META[tag as keyof typeof TAG_META]?.label ?? tag;

  // Option order is fixed while the panel is open, so chips don't jump as you tap (app 505–520).
  const langOptions = useMemo(() => optionsByCount(cards.map(c => c.language), state.lang),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, open]);
  const countryOptions = useMemo(() => optionsByCount(cards.map(c => c.country), state.country),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, open]);

  const results = useMemo(
    () => (searching ? searchCards(filterCards(cards, state), state.q, tagText) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, state, searching],
  );

  return (
    <div>
      <div className="mt-10">
        <FilterBar
          query={state.q}
          onQuery={q => setState(s => ({ ...s, q }))}
          filters={state}
          onFilters={f => setState(s => ({ ...s, ...f }))}
          open={open}
          onOpen={setOpen}
          langOptions={langOptions}
          countryOptions={countryOptions}
          labels={labels}
          tagLabels={tagLabels}
          locale={locale}
        />
      </div>

      {searching ? (
        <section className="mt-10" aria-live="polite">
          <p className="text-sm text-faint">{(results.length === 1 ? resultsLabel.one : resultsLabel.other).replace('#', String(results.length))}</p>
          {results.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(c => <CardView key={c.id} c={c} />)}
            </div>
          ) : (
            <Empty title={labels.noneTitle} text={labels.noneText} />
          )}
        </section>
      ) : children}
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-3xl border border-border bg-surface p-10 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted">{text}</p>
      {children}
    </div>
  );
}
