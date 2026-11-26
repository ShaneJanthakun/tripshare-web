import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase/env';
import { REVALIDATE_S } from './guides/queries';
import { type PublicGuide, isSeedAuthor, displayAuthor, TEAM_NAME } from './guides/model';
import { ADMIN_USER_ID } from './core/guide';

// Public profiles (plan F5.2, B9 = yes 27.11.2026): name, bio, photo and follower count from the
// database function get_public_profile (M4), which only answers for users with a published
// public guide. Read anonymously and cached with the page (ISR), like the guides.

export type PublicProfile = { id: string; name: string; bio: string; photoUrl: string; followers: number };

/** Authors who get a profile page: real users, not the team or the seed authors (B1). */
export function hasProfile(p: PublicGuide): boolean {
  return !!p.authorId && !isSeedAuthor(p.authorId) && !['user_team', 'user_ai', ADMIN_USER_ID].includes(p.authorId) && displayAuthor(p) !== TEAM_NAME;
}

export async function loadPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!id || id.length > 100) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_profile`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user_id: id }),
    next: { revalidate: REVALIDATE_S, tags: ['guides', `profile:${id}`] },
  });
  if (!res.ok) {
    if (res.status !== 404) throw new Error(`get_public_profile: HTTP ${res.status}`);
    return null; // the function isn't there yet (M4 not run): no profile pages
  }
  const rows = (await res.json()) as { id: string; name: string | null; bio: string | null; photo_url: string | null; followers: number | null }[];
  const r = rows[0];
  if (!r) return null;
  return { id: r.id, name: (r.name ?? '').trim() || 'TripShare', bio: (r.bio ?? '').trim(), photoUrl: r.photo_url?.startsWith('https://') ? r.photo_url : '', followers: r.followers ?? 0 };
}
