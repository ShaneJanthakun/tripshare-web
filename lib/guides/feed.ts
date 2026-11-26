import type { SupabaseClient } from '@supabase/supabase-js';
import { migrate, TAG_META, type GuideTag } from '../core/guide';
import type { PublicGuide } from './model';
import { langName, type Filters } from './discover';

// The signed-in feed (plan F4.3–F4.5, F4.7), a copy of the app: the same queries as
// storage/guides.ts and the same sections, search and filters as HomeScreen (522–617).
// Used from the browser with the user's session, so blocked authors and RLS apply as in the app.

export const FEED_PAGE = 20;
const COLUMNS = 'id,author_id,data,upvotes,views,updated_at,created_at';

type Row = { id: string; author_id: string | null; data: unknown; upvotes: number | null; views: number | null; updated_at: string | null; created_at: string | null };

export function toGuides(rows: Row[] | null): PublicGuide[] {
  return (rows ?? []).flatMap(row => {
    if (!row?.data || typeof row.data !== 'object') return [];
    try {
      const guide = { ...migrate(row.data), id: row.id };
      return [{
        guide,
        authorId: row.author_id ?? guide.authorId ?? '',
        upvotes: row.upvotes ?? 0,
        views: row.views ?? 0,
        updatedAt: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
        createdAt: row.created_at ?? new Date(0).toISOString(),
      }];
    } catch {
      return [];
    }
  });
}

/** One page of the feed: published public guides, newest first (app loadGuides). */
export async function loadFeedPage(sb: SupabaseClient, page: number): Promise<{ guides: PublicGuide[]; hasMore: boolean; ok: boolean }> {
  const from = page * FEED_PAGE;
  const { data, error } = await sb.from('guides').select(COLUMNS)
    .eq('is_draft', false).eq('is_public', true)
    .order('created_at', { ascending: false }).order('id', { ascending: true })
    .range(from, from + FEED_PAGE - 1);
  if (error) return { guides: [], hasMore: false, ok: false };
  return { guides: toGuides(data as Row[]), hasMore: (data ?? []).length === FEED_PAGE, ok: true };
}

/** Characters that are wildcards in ilike or break PostgREST's or() syntax are removed. */
export const cleanQuery = (q: string) => q.trim().replace(/[%_,()]/g, '');

/** Server search beyond the loaded pages (app searchGuides): title, destination, country; 30. */
export async function searchGuidesServer(sb: SupabaseClient, query: string): Promise<PublicGuide[]> {
  const term = cleanQuery(query);
  if (term.length < 2) return [];
  const { data, error } = await sb.from('guides').select(COLUMNS)
    .eq('is_draft', false).eq('is_public', true)
    .or(`title.ilike.%${term}%,destination.ilike.%${term}%,country.ilike.%${term}%`)
    .limit(30);
  return error ? [] : toGuides(data as Row[]);
}

export type Person = { id: string; name: string; photo_url: string | null };

/** People by name only, never e-mail (plan M5c); not yourself and not people you blocked; 5. */
export async function searchPeople(sb: SupabaseClient, query: string, me: string, blocked: string[]): Promise<Person[]> {
  const term = cleanQuery(query);
  if (term.length < 2) return [];
  const { data } = await sb.from('user_profiles').select('id, name, photo_url').ilike('name', `%${term}%`).limit(5);
  return ((data ?? []) as Person[]).filter(p => p.id !== me && !blocked.includes(p.id));
}

/** Guides by id in the order of the list (app loadGuidesByIds), 100 per request. */
export async function loadGuidesByIds(sb: SupabaseClient, ids: string[]): Promise<PublicGuide[]> {
  if (!ids.length) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
  const results = await Promise.all(chunks.map(c => sb.from('guides').select(COLUMNS).in('id', c)));
  const byId = new Map(results.flatMap(r => toGuides((r.data ?? []) as Row[])).map(p => [p.guide.id, p]));
  return ids.flatMap(id => (byId.has(id) ? [byId.get(id)!] : []));
}

export type FeedProfile = { following: string[]; blocked: string[]; prefTags: string[]; prefCountries: string[] };

const matchesFilters = (p: PublicGuide, f: Filters) =>
  (!f.lang || (!!p.guide.language && langName(p.guide.language) === f.lang)) &&
  (!f.country || p.guide.country === f.country) &&
  (f.tags.length === 0 || (p.guide.tags ?? []).some(t => f.tags.includes(t)));

export type FeedSection = { key: 'following' | 'forYou' | 'mostLoved' | 'discover'; guides: PublicGuide[] };

/** The app's feed sections (H:588–615). `seen` = guides opened before (localStorage on the web). */
export function buildSections(guides: PublicGuide[], profile: FeedProfile, seen: Set<string>, f: Filters): FeedSection[] {
  const visible = dedupe(guides).filter(p => !profile.blocked.includes(p.authorId) && matchesFilters(p, f));
  const matchesPrefs = (p: PublicGuide) =>
    (p.guide.tags ?? []).some(t => profile.prefTags.includes(t)) ||
    profile.prefCountries.some(c =>
      (p.guide.country ?? '').toLowerCase().includes(c.toLowerCase()) ||
      (p.guide.destination ?? '').toLowerCase().includes(c.toLowerCase()));
  const allFollowing = visible.filter(p => profile.following.includes(p.authorId));
  const unseenFollow = allFollowing.filter(p => !seen.has(p.guide.id));
  const seenFollow = allFollowing.filter(p => seen.has(p.guide.id));
  const followingIds = new Set(allFollowing.map(p => p.guide.id));
  const hasPrefs = profile.prefTags.length > 0 || profile.prefCountries.length > 0;
  const forYou = hasPrefs ? visible.filter(p => !followingIds.has(p.guide.id) && matchesPrefs(p)) : [];
  const forYouIds = new Set(forYou.map(p => p.guide.id));
  const remaining = [...seenFollow, ...visible.filter(p => !followingIds.has(p.guide.id) && !forYouIds.has(p.guide.id))];
  const mostLoved = remaining.filter(p => p.upvotes > 0).sort((a, b) => b.upvotes - a.upvotes);
  const discover = remaining.filter(p => p.upvotes === 0);
  return ([
    { key: 'following', guides: unseenFollow },
    { key: 'forYou', guides: forYou },
    { key: 'mostLoved', guides: mostLoved },
    { key: 'discover', guides: discover },
  ] as FeedSection[]).filter(s => s.guides.length > 0);
}

/** The app's search in the feed (H:538–567): loaded guides first, then server hits, ranked. */
export function searchFeed(loaded: PublicGuide[], server: PublicGuide[], query: string, profile: FeedProfile, f: Filters, tagText: (tag: string) => string): PublicGuide[] {
  const q = query.toLowerCase().trim();
  const ok = (p: PublicGuide) => !profile.blocked.includes(p.authorId) && matchesFilters(p, f);
  const local = dedupe(loaded).filter(p => ok(p) && (
    (p.guide.destination ?? '').toLowerCase().includes(q) ||
    (p.guide.country ?? '').toLowerCase().includes(q) ||
    (p.guide.title ?? '').toLowerCase().includes(q) ||
    (p.guide.tags ?? []).some(tag => (TAG_META[tag as GuideTag]?.label.toLowerCase().includes(q) ?? false) ||
      tagText(tag).toLowerCase().includes(q) || tag.toLowerCase().includes(q))));
  const seenIds = new Set(local.map(p => p.guide.id));
  const merged = [...local, ...server.filter(p => !seenIds.has(p.guide.id) && ok(p))];
  const rank = (p: PublicGuide) => {
    const d = (p.guide.destination ?? '').toLowerCase();
    if (d === q || d.startsWith(q)) return 0;
    if (d.includes(q)) return 1;
    if ((p.guide.country ?? '').toLowerCase().includes(q)) return 2;
    if ((p.guide.title ?? '').toLowerCase().includes(q)) return 3;
    return 4;
  };
  return merged.sort((a, b) => rank(a) - rank(b) || b.upvotes - a.upvotes);
}

function dedupe(guides: PublicGuide[]): PublicGuide[] {
  const seen = new Set<string>();
  return guides.filter(p => (seen.has(p.guide.id) ? false : (seen.add(p.guide.id), true)));
}

// ─── "Seen" guides: the app keeps them on the phone; the web keeps them in localStorage ──────
const SEEN_KEY = 'tripshare_viewed_guides_v1';
export function readSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')); } catch { return new Set(); }
}
export function markSeen(id: string): void {
  try {
    const s = readSeen();
    s.add(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-500)));
  } catch { /* private mode: nothing is remembered */ }
}
