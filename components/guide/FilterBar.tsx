'use client';

import { ALL_TAGS, TAG_META } from '../../lib/core/guide';
import { countryLabel, type Filters } from '../../lib/guides/discover';

// Search field + "Filters" with the app's three filters (HomeScreen 730–812): travel types
// (multiple, OR), language and country (one each). Used on /guides and in the feed.

export type FilterLabels = {
  search: string;
  filters: string;
  travelType: string;
  language: string;
  country: string;
  reset: string;
};

type Props = {
  query: string;
  onQuery: (q: string) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  open: boolean;
  onOpen: (open: boolean) => void;
  langOptions: string[];
  countryOptions: string[];
  labels: FilterLabels;
  tagLabels: Record<string, string>;
  locale: string;
};

export default function FilterBar({ query, onQuery, filters, onFilters, open, onOpen, langOptions, countryOptions, labels, tagLabels, locale }: Props) {
  const active = filters.tags.length + (filters.lang ? 1 : 0) + (filters.country ? 1 : 0);
  const tagText = (tag: string) => tagLabels[tag] ?? TAG_META[tag as keyof typeof TAG_META]?.label ?? tag;
  const toggleTag = (tag: string) =>
    onFilters({ ...filters, tags: filters.tags.includes(tag) ? filters.tags.filter(t => t !== tag) : [...filters.tags, tag] });
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition-colors ${on ? 'border-accent bg-accent/15 text-ink' : 'border-border text-muted hover:text-ink'}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">{labels.search}</span>
          <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder={labels.search}
            className="w-full rounded-2xl border border-border bg-surface py-3 pl-11 pr-4 text-[15px] text-ink outline-none placeholder:text-faint focus:border-accent/60" />
        </label>
        <button type="button" onClick={() => onOpen(!open)} aria-expanded={open}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${open || active ? 'border-accent/60 bg-accent/10' : 'border-border hover:bg-surface'}`}>
          {labels.filters}
          {active > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-white">{active}</span>}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-5 rounded-3xl border border-border bg-surface p-5">
          <Row title={labels.travelType}>
            {ALL_TAGS.map(tag => (
              <button key={tag} type="button" aria-pressed={filters.tags.includes(tag)} onClick={() => toggleTag(tag)} className={chip(filters.tags.includes(tag))}>
                {TAG_META[tag].icon} {tagText(tag)}
              </button>
            ))}
          </Row>
          {langOptions.length > 1 && (
            <Row title={labels.language}>
              {langOptions.map(l => (
                <button key={l} type="button" aria-pressed={filters.lang === l} onClick={() => onFilters({ ...filters, lang: filters.lang === l ? '' : l })} className={chip(filters.lang === l)}>{l}</button>
              ))}
            </Row>
          )}
          {countryOptions.length > 1 && (
            <Row title={labels.country}>
              {countryOptions.map(c => (
                <button key={c} type="button" aria-pressed={filters.country === c} onClick={() => onFilters({ ...filters, country: filters.country === c ? '' : c })} className={chip(filters.country === c)}>
                  {countryLabel(c, locale)}
                </button>
              ))}
            </Row>
          )}
          {active > 0 && (
            <button type="button" onClick={() => onFilters({ tags: [], lang: '', country: '' })} className="text-sm font-semibold text-accent">{labels.reset}</button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
