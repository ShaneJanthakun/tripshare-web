import type { SupabaseClient } from '@supabase/supabase-js';
import { migrate, type TravelGuide } from '../core/guide';

// The signed-in user's own guides, all of them (drafts and private too), newest first —
// as the app's loadGuidesByAuthor (plan F2.7). RLS lets authors read their own rows.
export type OwnGuide = { guide: TravelGuide; version: number | null; updatedAt: string; upvotes: number; views: number };

export async function loadOwnGuides(supabase: SupabaseClient, userId: string): Promise<OwnGuide[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('id, data, version, is_draft, is_public, is_completed, updated_at, upvotes, views')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });
  if (error) throw new Error(`own guides: ${error.message}`);
  return (data ?? []).flatMap((row: any) => {
    if (!row?.data || typeof row.data !== 'object') return [];
    return [{
      guide: { ...migrate(row.data), id: row.id },
      version: row.version ?? null,
      updatedAt: row.updated_at ?? '',
      upvotes: row.upvotes ?? 0,
      views: row.views ?? 0,
    }];
  });
}
