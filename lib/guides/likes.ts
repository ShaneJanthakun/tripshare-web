import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from '../supabase/env';

// Likes from the website (plan F4.6), done the way the app does it (GuideDetailScreen handleLike,
// UserContext.toggleUpvote): the RPC toggle_guide_upvote keeps guide_upvotes and the count, and
// the profile's upvoted_guides list (what the app shows as "Liked") is brought in line with it.
// The list is read fresh right before it is written, so a like made in the app meanwhile stays.
// When M2 is run, the RPC keeps the list itself and the second step finds nothing to change.
// Notifying the author waits for the notify function (M3).

/** The sign-in cookie's name: a cheap "might be signed in" check before loading Supabase. */
export const AUTH_COOKIE = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
export const hasAuthCookie = () => typeof document !== 'undefined' && document.cookie.split('; ').some(c => c.startsWith(AUTH_COOKIE));

/** Guides the user has liked (guide_upvotes is what the RPC toggles on). */
export async function myLikes(sb: SupabaseClient, me: string): Promise<Set<string>> {
  const { data } = await sb.from('guide_upvotes').select('guide_id').eq('user_id', me).limit(2000);
  return new Set(((data ?? []) as { guide_id: string }[]).map(r => r.guide_id));
}

export async function isLiked(sb: SupabaseClient, me: string, guideId: string): Promise<boolean> {
  const { data } = await sb.from('guide_upvotes').select('guide_id').eq('user_id', me).eq('guide_id', guideId).maybeSingle();
  return !!data;
}

/** Like or unlike. Returns the new count and state, or count null when it failed. */
export async function toggleLike(sb: SupabaseClient, me: string, guideId: string): Promise<{ count: number | null; liked: boolean }> {
  const { data, error } = await sb.rpc('toggle_guide_upvote', { p_guide_id: guideId });
  if (error) return { count: null, liked: false };
  const liked = await isLiked(sb, me, guideId);
  await syncLikedList(sb, me, guideId, liked);
  return { count: typeof data === 'number' ? data : null, liked };
}

async function syncLikedList(sb: SupabaseClient, me: string, guideId: string, liked: boolean): Promise<void> {
  const { data } = await sb.from('user_profiles').select('upvoted_guides').eq('id', me).maybeSingle();
  const list = ((data as { upvoted_guides?: string[] } | null)?.upvoted_guides ?? []);
  if (list.includes(guideId) === liked) return;
  const next = liked ? [...list, guideId] : list.filter(id => id !== guideId);
  await sb.from('user_profiles').update({ upvoted_guides: next, updated_at: new Date().toISOString() }).eq('id', me);
}
