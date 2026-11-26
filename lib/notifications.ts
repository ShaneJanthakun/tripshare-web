import type { SupabaseClient } from '@supabase/supabase-js';

// Notifications (plan M8): the database makes a row for every like, comment and follow, and for
// a new guide from someone you follow, whether it happened in the app or on the website. You can
// only read your own and only mark them read.

export type NotificationType = 'like' | 'comment' | 'follow' | 'publish';
export type Notification = {
  id: number;
  type: NotificationType;
  actorId: string;
  actorName: string;
  guideId: string | null;
  guideTitle: string;
  createdAt: string;
  read: boolean;
};

type Row = { id: number; type: NotificationType; actor_id: string; actor_name: string; guide_id: string | null; guide_title: string; created_at: string; read_at: string | null };

export async function loadNotifications(sb: SupabaseClient, limit = 100): Promise<Notification[] | null> {
  const { data, error } = await sb.from('notifications')
    .select('id, type, actor_id, actor_name, guide_id, guide_title, created_at, read_at')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) return null; // the table isn't there yet (M8 not run) or no access
  return ((data ?? []) as Row[]).map(r => ({
    id: r.id, type: r.type, actorId: r.actor_id, actorName: r.actor_name, guideId: r.guide_id,
    guideTitle: r.guide_title, createdAt: r.created_at, read: !!r.read_at,
  }));
}

export async function unreadCount(sb: SupabaseClient): Promise<number> {
  const { count, error } = await sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  return error ? 0 : count ?? 0;
}

export async function markAllRead(sb: SupabaseClient): Promise<boolean> {
  const { error } = await sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  return !error;
}
