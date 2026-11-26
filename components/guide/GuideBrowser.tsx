'use client';

import { useEffect, useMemo, useState } from 'react';
import { ALL_TAGS, TAG_META } from '../../lib/core/guide';
import { searchCards, filterCards, optionsByCount, countryLabel, type CardData, type Filters } from '../../lib/guides/discover';
import CardView from './CardView';

// Search and filter on /guides (plan F4.4–F4.5), with the app's rules: search on place, title and
// travel type, ranked like the app; travel types OR'ed, language and country exact, AND'ed.
// The choices live in the URL (?q=…&tag=foodie&lang=English&country=Italy), so they can be shared.
// With nothing chosen, the static sections (children) are shown, so crawlers see every guide.

export type BrowserLabels = {
  search: string;
  filters: string;
  travelType: string;
  language: string;
  country: string;
  reset: string;
  noneTitle: string;
  noneText: string;
};

type Props = {
  cards: CardData[];
  locale: string;
  labels: BrowserLabels;
  resultsLabel: { one: string; other: string };
  tagLabels: Record<string, string>;
  children: React.ReactNode;
};

const readFilters = (p: URLSearchParams): Filters & { q: string } => ({
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
    const fromUrl = readFilters(new URLSearchParams(window.location.search));
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

  const set = (patch: Partial<typeof state>) => setState(s => ({ ...s, ...patch }));
  const toggleTag = (tag: string) => set({ tags: state.tags.includes(tag) ? state.tags.filter(t => t !== tag) : [...state.tags, tag] });
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition-colors ${on ? 'border-accent bg-accent/15 text-ink' : 'border-border text-muted hover:text-ink'}`;

  return (
    <div>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">{labels.search}</span>
          <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" value={state.q} onChange={e => set({ q: e.target.value })} placeholder={labels.search}
            className="w-full rounded-2xl border border-border bg-surface py-3 pl-11 pr-4 text-[15px] text-ink outline-none placeholder:text-faint focus:border-accent/60" />
        </label>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${open || active ? 'border-accent/60 bg-accent/10' : 'border-border hover:bg-surface'}`}>
          {labels.filters}
          {active > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-white">{active}</span>}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-5 rounded-3xl border border-border bg-surface p-5">
          <FilterRow title={labels.travelType}>
            {ALL_TAGS.map(tag => (
              <button key={tag} type="button" aria-pressed={state.tags.includes(tag)} onClick={() => toggleTag(tag)} className={chip(state.tags.includes(tag))}>
                {TAG_META[tag].icon} {tagText(tag)}
              </button>
            ))}
          </FilterRow>
          {langOptions.length > 1 && (
            <FilterRow title={labels.language}>
              {langOptions.map(l => (
                <button key={l} type="button" aria-pressed={state.lang === l} onClick={() => set({ lang: state.lang === l ? '' : l })} className={chip(state.lang === l)}>{l}</button>
              ))}
            </FilterRow>
          )}
          {countryOptions.length > 1 && (
            <FilterRow title={labels.country}>
              {countryOptions.map(c => (
                <button key={c} type="button" aria-pressed={state.country === c} onClick={() => set({ country: state.country === c ? '' : c })} className={chip(state.country === c)}>
                  {countryLabel(c, locale)}
                </button>
              ))}
            </FilterRow>
          )}
          {active > 0 && (
            <button type="button" onClick={() => set({ tags: [], lang: '', country: '' })} className="text-sm font-semibold text-accent">{labels.reset}</button>
          )}
        </div>
      )}

      {searching ? (
        <section className="mt-10" aria-live="polite">
          <p className="text-sm text-faint">{(results.length === 1 ? resultsLabel.one : resultsLabel.other).replace('#', String(results.length))}</p>
          {results.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(c => <CardView key={c.id} c={c} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-border bg-surface p-10 text-center">
              <p className="font-display text-xl font-bold">{labels.noneTitle}</p>
              <p className="mt-2 text-sm text-muted">{labels.noneText}</p>
            </div>
          )}
        </section>
      ) : children}
    </div>
  );
}

function FilterRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
