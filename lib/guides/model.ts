import { type TravelGuide, type TripDay, type CustomSection, langCode, getOrder, parseCoords, ADMIN_USER_ID } from '../core/guide';

// What the public pages derive from a guide: slug, SEO title, word count, author, language.
// Rules: plan/04-fase-1-guidesider.md and plan/12-seo.md § 3.

export const SITE_LOCALES = ['en', 'no', 'es', 'fr', 'pt', 'th', 'ja', 'zh', 'ko', 'de'] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export type PublicGuide = {
  guide: TravelGuide;
  authorId: string;
  upvotes: number;
  views: number;
  updatedAt: string;
  createdAt: string;
};

export const DAY_COLORS = ['#FF5C38', '#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F43F5E'];
export const dayColor = (i: number) => DAY_COLORS[i % DAY_COLORS.length];
export const STAY_COLOR = '#3B82F6';
export const TEAM_NAME = 'TripShare Team';

// ─── Author (decision B1 = a: seed authors are shown as TripShare Team) ──────
export const isSeedAuthor = (authorId: string) => authorId.startsWith('seed_');
export function displayAuthor(p: PublicGuide): string {
  if (isSeedAuthor(p.authorId)) return TEAM_NAME;
  return p.guide.authorName?.trim() || TEAM_NAME;
}
/** Team guides (and admin, as in the app's feed) show neither views nor likes. */
export function showsCounts(p: PublicGuide): boolean {
  return !['user_team', 'user_ai', ADMIN_USER_ID].includes(p.authorId) && displayAuthor(p) !== TEAM_NAME;
}

// ─── Size ─────────────────────────────────────────────────────────────────────
export const daysWithStops = (g: TravelGuide) => (g.days ?? []).filter(d => (d.stops ?? []).length > 0);
export const stopCount = (g: TravelGuide) => (g.days ?? []).reduce((n, d) => n + (d.stops ?? []).length, 0);

const words = (s: unknown) => (typeof s === 'string' ? s.split(/\s+/).filter(Boolean).length : 0);
/** Visible words: title, description, tips, day names, stops (name, address, notes), sections and places. */
export function wordCount(g: TravelGuide): number {
  let n = words(g.title) + words(g.description);
  for (const t of g.generalTips ?? []) n += words(t);
  for (const d of g.days ?? []) {
    n += words(d.label);
    for (const s of d.stops ?? []) n += words(s.name) + words(s.notes) + words(s.address);
  }
  for (const s of g.customSections ?? []) {
    n += words(s.title) + words(s.note);
    for (const i of s.items ?? []) n += words(String(i).split('|||')[0]);
    for (const c of s.checklistItems ?? []) n += words(c.text);
  }
  for (const p of g.placesToVisit ?? []) n += words(p.name) + words(p.notes) + words(p.address);
  return n;
}
export const THIN_WORDS = 350;
/** Thin pages get noindex, follow and stay out of the sitemap (12-seo.md § 3, rule 5). */
export const isThin = (g: TravelGuide) => wordCount(g) < THIN_WORDS;

// ─── Language, slug and URLs ─────────────────────────────────────────────────
/** The guide's own language if the site has it, otherwise English. Canonical URLs use it. */
export function guideLocale(g: TravelGuide): SiteLocale {
  const code = langCode(g.language);
  return (SITE_LOCALES as readonly string[]).includes(code ?? '') ? (code as SiteLocale) : 'en';
}

export function slugify(text: string): string {
  const s = (text ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length <= 60) return s || 'guide';
  const cut = s.slice(0, 60);
  return (cut.lastIndexOf('-') > 30 ? cut.slice(0, cut.lastIndexOf('-')) : cut).replace(/-+$/, '') || 'guide';
}

export function guideSlug(g: TravelGuide): string {
  const n = daysWithStops(g).length;
  if (guideLocale(g) === 'en' && n > 0 && g.destination?.trim()) return slugify(`${g.destination}-${n}-day-itinerary`);
  return slugify(g.title || g.destination);
}

export const guidePath = (locale: string, g: TravelGuide) =>
  `/${locale}/guide/${encodeURIComponent(g.id)}/${guideSlug(g)}`;

// ─── SEO title ───────────────────────────────────────────────────────────────
const MAX_TITLE = 65;
const PARTS = /\s+[—–]\s+|:\s+/;

/**
 * "{destination} {N}-Day Itinerary – {title}" (template per language), kept under 65 characters:
 * first part of the guide title, or the second part when the first is just the destination,
 * then cut at a word boundary. Guides without days with stops: "{title} – {destination}".
 */
export function seoTitle(g: TravelGuide, template: (title: string) => string, noDaysTemplate: string): string {
  if (daysWithStops(g).length === 0) return noDaysTemplate;
  const full = template(g.title.trim());
  if (full.length <= MAX_TITLE) return full;
  const parts = g.title.split(PARTS).map(p => p.trim()).filter(Boolean);
  let short = parts[0] ?? g.title;
  if (parts.length > 1 && short.toLowerCase() === (g.destination ?? '').trim().toLowerCase()) short = parts[1];
  let candidate = template(short);
  while (candidate.length > MAX_TITLE && short.includes(' ')) {
    short = short.slice(0, short.lastIndexOf(' ')).replace(/[\s,;:–—-]+$/, '');
    candidate = template(short);
  }
  return candidate;
}

/** Cut at a word boundary, max chars, with an ellipsis when cut. */
export function excerpt(text: string, max: number): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const i = cut.lastIndexOf(' ');
  return (i > max * 0.6 ? cut.slice(0, i) : cut).replace(/[\s,;:.–—-]+$/, '') + '…';
}

// ─── Places ──────────────────────────────────────────────────────────────────
/** First two comma parts, as in the app. */
export function shortAddress(address: string): string {
  const parts = (address ?? '').split(',').map(p => p.trim()).filter(Boolean);
  return parts.length > 2 ? parts.slice(0, 2).join(', ') : (address ?? '');
}

/** Apple Maps link; the guide's destination and country are added when the address lacks them. */
export function mapsLink(address: string, g: TravelGuide): string {
  let q = address.trim();
  if (!parseCoords(q)) {
    const lc = q.toLowerCase();
    const missing = [g.destination, g.country].map(s => (s ?? '').trim()).filter(p => p && !lc.includes(p.toLowerCase()));
    if (missing.length) q = `${q}, ${missing.join(', ')}`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(q)}`;
}

/** Days and custom sections in the guide's order (empty sectionOrder → days, then sections). */
export type Block =
  | { kind: 'day'; day: TripDay; index: number }
  | { kind: 'section'; section: CustomSection };

export function orderedBlocks(g: TravelGuide): Block[] {
  return getOrder(g).flatMap((e): Block[] => {
    if (e.kind === 'day') {
      const index = g.days.findIndex(d => d.id === e.id);
      return index >= 0 ? [{ kind: 'day' as const, day: g.days[index] as TripDay, index }] : [];
    }
    const section = g.customSections.find(s => s.id === e.id);
    return section ? [{ kind: 'section' as const, section }] : [];
  });
}

/** Booking link as the app opens it: http(s) kept, everything else gets https://. */
export function normalizeUrl(raw: string): string {
  const u = (raw ?? '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/** booking.com links get our affiliate id when it is configured and missing. */
export function monetizeLink(url: string): string {
  const aid = process.env.NEXT_PUBLIC_BOOKING_AID;
  if (!aid || !/booking\.com/i.test(url) || /[?&]aid=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}aid=${encodeURIComponent(aid)}`;
}
