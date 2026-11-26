import { ALL_TAGS, COUNTRIES, TAG_META, langCode, type GuideTag } from '../core/guide';
import { type PublicGuide, slugify, showsCounts, displayAuthor, daysWithStops, stopCount, guideLocale, guidePath } from './model';

// Discovery on the website (plan/08-fase-4-oppdag-og-likes.md): landing pages per country and
// travel type, and the data the search/filter on /guides works on. Same rules as the app's feed.

/** A landing page needs at least this many guides, or it is too thin to be worth indexing. */
export const MIN_LANDING = 2;

// ─── Countries ────────────────────────────────────────────────────────────────
// Guides store the country as an English name ("Italy"); the flag in COUNTRIES gives the ISO
// code, and the browser/Node ICU gives the name in each language ("Italia", "イタリア").

const FLAG_A = 0x1f1e6;
const isoOf = new Map(COUNTRIES.map(c => [c.name.toLowerCase(), [...c.flag].map(ch => String.fromCharCode(ch.codePointAt(0)! - FLAG_A + 65)).join('')]));

export function countryCode(name: string): string | undefined {
  const code = isoOf.get(name.trim().toLowerCase());
  return code && /^[A-Z]{2}$/.test(code) ? code : undefined;
}

export function countryLabel(name: string, locale: string): string {
  const code = countryCode(name);
  if (!code) return name;
  try {
    return new Intl.DisplayNames([locale === 'no' ? 'nb' : locale], { type: 'region' }).of(code) ?? name;
  } catch {
    return name;
  }
}

export const countrySlug = (name: string) => slugify(name);
export const tagSlug = (tag: string) => tag.replace(/_/g, '-');
export const tagFromSlug = (slug: string): GuideTag | undefined => ALL_TAGS.find(t => tagSlug(t) === slug);

export type Landing = { slug: string; count: number };
export type CountryLanding = Landing & { name: string };
export type TagLanding = Landing & { tag: GuideTag };

/** Countries with enough guides for their own page, most guides first. */
export function landingCountries(guides: PublicGuide[]): CountryLanding[] {
  const counts = new Map<string, number>();
  for (const p of guides) {
    const c = p.guide.country?.trim();
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, n]) => n >= MIN_LANDING)
    .map(([name, count]) => ({ name, count, slug: countrySlug(name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Travel types (the app's 16) with enough guides for their own page, most guides first. */
export function landingTags(guides: PublicGuide[]): TagLanding[] {
  return ALL_TAGS
    .map(tag => ({ tag, slug: tagSlug(tag), count: guides.filter(p => (p.guide.tags ?? []).includes(tag)).length }))
    .filter(t => t.count >= MIN_LANDING)
    .sort((a, b) => b.count - a.count);
}

export const guidesInCountry = (guides: PublicGuide[], slug: string) =>
  guides.filter(p => p.guide.country?.trim() && countrySlug(p.guide.country.trim()) === slug);
export const guidesWithTag = (guides: PublicGuide[], tag: GuideTag) =>
  guides.filter(p => (p.guide.tags ?? []).includes(tag));

// ─── Cards for the search and filter (client side) ──────────────────────────

/** Language as the app's filter shows it: codes and names grouped under one name. */
const LANG_NAMES: Record<string, string> = {
  en: 'English', no: 'Norsk', es: 'Español', fr: 'Français', pt: 'Português', th: 'ไทย',
  ja: '日本語', zh: '中文', ko: '한국어', de: 'Deutsch',
};
export const langName = (v: string) => LANG_NAMES[v.toLowerCase()] ?? LANG_NAMES[langCode(v) ?? ''] ?? v;

/** What a guide card shows, plus what search and filter need. Small and serialisable. */
export type CardData = {
  id: string;
  href: string;
  title: string;
  place: string;
  cover: string;
  initial: string;
  meta: string;
  destination: string;
  country: string;
  tags: string[];
  language: string;
  upvotes: number;
  showCount: boolean;
};

type CardTexts = { days: (n: number) => string; stops: (n: number) => string; by: (name: string) => string };

export function cardData(p: PublicGuide, t: CardTexts): CardData {
  const g = p.guide;
  const n = daysWithStops(g).length;
  const s = stopCount(g);
  return {
    id: g.id,
    href: guidePath(guideLocale(g), g),
    title: g.title,
    place: [g.destination, g.country].filter(Boolean).join(', '),
    cover: g.coverImage ?? '',
    initial: (g.destination || g.title || '?').charAt(0).toUpperCase(),
    meta: [n > 0 ? t.days(n) : null, s > 0 ? t.stops(s) : null, t.by(displayAuthor(p))].filter(Boolean).join(' · '),
    destination: g.destination ?? '',
    country: g.country ?? '',
    tags: g.tags ?? [],
    language: g.language ? langName(g.language) : '',
    upvotes: p.upvotes,
    showCount: showsCounts(p),
  };
}

/** The app's search (HomeScreen 538–567): local matches on place, title and tags, ranked. */
export function searchCards(cards: CardData[], query: string, tagText: (tag: string) => string): CardData[] {
  const q = query.toLowerCase().trim();
  if (!q) return cards;
  const hits = cards.filter(c =>
    c.destination.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q) ||
    c.title.toLowerCase().includes(q) ||
    c.tags.some(tag => tag.toLowerCase().includes(q) ||
      (TAG_META[tag as GuideTag]?.label.toLowerCase().includes(q) ?? false) ||
      tagText(tag).toLowerCase().includes(q)));
  const rank = (c: CardData) => {
    const d = c.destination.toLowerCase();
    if (d === q || d.startsWith(q)) return 0;
    if (d.includes(q)) return 1;
    if (c.country.toLowerCase().includes(q)) return 2;
    if (c.title.toLowerCase().includes(q)) return 3;
    return 4;
  };
  return hits.sort((a, b) => rank(a) - rank(b) || b.upvotes - a.upvotes);
}

export type Filters = { tags: string[]; lang: string; country: string };

/** The app's filter: travel types OR'ed, language and country exact; the three AND'ed. */
export function filterCards(cards: CardData[], f: Filters): CardData[] {
  return cards.filter(c =>
    (!f.lang || c.language === f.lang) &&
    (!f.country || c.country === f.country) &&
    (f.tags.length === 0 || c.tags.some(t => f.tags.includes(t))));
}

/** Filter options by how many guides use them, the active one first (app sortByCount). */
export function optionsByCount(values: string[], active: string): string[] {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach(v => counts.set(v, (counts.get(v) ?? 0) + 1));
  const sorted = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b));
  return active && sorted.includes(active) ? [active, ...sorted.filter(v => v !== active)] : sorted;
}
