import type { SupabaseClient } from '@supabase/supabase-js';
import { uid } from './core/guide';

// Social actions from the website (plan 09, phase 5), done the way the app does them
// (UserContext toggleFollow/blockUser/unblockUser, storage/guides comments): the user's own
// profile row and their own comments. Arrays are read fresh right before they are written, so a
// change made in the app meanwhile stays. Notifications wait for the notify function (M3).

type ListColumn = 'following' | 'blocked_users';

async function setInList(sb: SupabaseClient, me: string, column: ListColumn, id: string, on: boolean): Promise<boolean> {
  const { data, error } = await sb.from('user_profiles').select(column).eq('id', me).maybeSingle();
  if (error) return false;
  const list: string[] = ((data as Record<string, string[] | null> | null)?.[column] ?? []);
  if (list.includes(id) === on) return true;
  const next = on ? [...list, id] : list.filter(x => x !== id);
  const { error: e2 } = await sb.from('user_profiles').update({ [column]: next, updated_at: new Date().toISOString() }).eq('id', me);
  return !e2;
}

export async function myLists(sb: SupabaseClient, me: string): Promise<{ following: string[]; blocked: string[] }> {
  const { data } = await sb.from('user_profiles').select('following, blocked_users').eq('id', me).maybeSingle();
  const row = (data ?? {}) as { following?: string[]; blocked_users?: string[] };
  return { following: row.following ?? [], blocked: row.blocked_users ?? [] };
}

/** Follow or unfollow; never yourself. */
export const setFollowing = (sb: SupabaseClient, me: string, userId: string, on: boolean) =>
  userId === me ? Promise.resolve(false) : setInList(sb, me, 'following', userId, on);

/** Block or unblock: their guides and comments are hidden for you (the app's isBlocked). */
export const setBlocked = (sb: SupabaseClient, me: string, userId: string, on: boolean) =>
  userId === me ? Promise.resolve(false) : setInList(sb, me, 'blocked_users', userId, on);

/** Reports go by e-mail, as in the app (App Store guideline 1.2). */
export const reportUserMail = (userId: string, name: string) =>
  `mailto:support@tripshare.online?subject=${encodeURIComponent(`Report user: ${name}`)}&body=${encodeURIComponent(`User ID: ${userId}\n\nReason:`)}`;
export const reportGuideMail = (guideId: string, title: string) =>
  `mailto:support@tripshare.online?subject=${encodeURIComponent(`Report: ${title}`)}&body=${encodeURIComponent(`Guide ID: ${guideId}\n\nReason:`)}`;

// ─── Comments (app storage/guides.ts 275–345) ─────────────────────────────────

export type GuideComment = { id: string; authorId: string; authorName: string; text: string; createdAt: string };
export const COMMENT_MAX = 2000;

type CommentRow = { id: string; author_id: string; author_name: string; text: string; created_at: string };
const toComment = (r: CommentRow): GuideComment => ({ id: r.id, authorId: r.author_id, authorName: r.author_name, text: r.text, createdAt: r.created_at });

export async function loadComments(sb: SupabaseClient, guideId: string): Promise<GuideComment[] | null> {
  const { data, error } = await sb.from('guide_comments').select('id, author_id, author_name, text, created_at')
    .eq('guide_id', guideId).order('created_at', { ascending: true });
  return error ? null : ((data ?? []) as CommentRow[]).map(toComment);
}

export async function addComment(sb: SupabaseClient, guideId: string, me: string, name: string, text: string): Promise<GuideComment | null> {
  const trimmed = text.trim().slice(0, COMMENT_MAX);
  if (!trimmed) return null;
  const { data, error } = await sb.from('guide_comments')
    .insert({ id: uid(), guide_id: guideId, author_id: me, author_name: name, text: trimmed }).select().single();
  return error || !data ? null : toComment(data as CommentRow);
}

export async function editComment(sb: SupabaseClient, id: string, text: string): Promise<boolean> {
  const trimmed = text.trim().slice(0, COMMENT_MAX);
  if (!trimmed) return false;
  const { data, error } = await sb.from('guide_comments').update({ text: trimmed }).eq('id', id).select('id');
  return !error && (data ?? []).length === 1;
}

/** Your own comment, or any comment on your own guide. Admin can't yet (RLS, plan M4b). */
export async function removeComment(sb: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await sb.from('guide_comments').delete().eq('id', id).select('id');
  return !error && (data ?? []).length === 1;
}
