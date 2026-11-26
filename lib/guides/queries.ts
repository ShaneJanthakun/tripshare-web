import { migrate } from '../core/guide';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase/env';
import type { PublicGuide } from './model';

// Reading published public guides for static pages (F1.1): anonymous key, no cookies, cached
// with the page (ISR, 10 minutes). Content comes from `data` via migrate(); the columns are only
// used for filtering (plan/11-fallgruver.md #9b). Public = is_public AND NOT is_draft (#6).
export const REVALIDATE_S = 600;
const COLUMNS = 'id,author_id,data,upvotes,views,updated_at,created_at';

type Row = {
  id: string; author_id: string | null; data: unknown; upvotes: number | null; views: number | null;
  updated_at: string | null; created_at: string | null;
};

async function rest(query: string): Promise<Row[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/guides?select=${COLUMNS}&is_public=eq.true&is_draft=eq.false&${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    next: { revalidate: REVALIDATE_S, tags: ['guides'] },
  });
  if (!res.ok) throw new Error(`guides: HTTP ${res.status}`);
  return res.json();
}

function toPublic(row: Row): PublicGuide | null {
  if (!row?.data || typeof row.data !== 'object') return null;
  const guide = { ...migrate(row.data), id: row.id };
  if (!guide.title && !guide.destination) return null;
  return {
    guide,
    authorId: row.author_id ?? guide.authorId ?? '',
    upvotes: row.upvotes ?? 0,
    views: row.views ?? 0,
    updatedAt: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
    createdAt: row.created_at ?? new Date(0).toISOString(),
  };
}

/** Every published public guide, newest first. */
export async function loadPublicGuides(): Promise<PublicGuide[]> {
  const rows = await rest('order=created_at.desc,id.asc&limit=2000');
  return rows.map(toPublic).filter((g): g is PublicGuide => !!g);
}

/** One published public guide, or null (draft, private or unknown id). */
export async function loadPublicGuide(id: string): Promise<PublicGuide | null> {
  if (!id || id.length > 100) return null;
  const rows = await rest(`id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] ? toPublic(rows[0]) : null;
}
