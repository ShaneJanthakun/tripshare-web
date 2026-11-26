import type { SupabaseClient } from '@supabase/supabase-js';
import { guideToRow, validateGuide, migrate, type TravelGuide, type GuideInvalidReason } from '../core/guide';

// Saving from the website (plan/01-arkitektur.md, data contract 1–9):
// update … eq('id') eq('version') select('version'). No row back → read the row again:
// a newer version means a conflict, the same version means no access (pitfall #4).
export type SaveResult =
  | { status: 'ok'; version: number }
  | { status: 'conflict'; latest: TravelGuide; version: number }
  | { status: 'denied' }
  | { status: 'invalid'; reason: GuideInvalidReason }
  | { status: 'error' };

/** The row as saved from the web, without id and author_id: the author never changes (rule 3). */
export function webRow(guide: TravelGuide) {
  const { id: _id, author_id: _author, ...row } = guideToRow(guide, 'web');
  return row;
}

export async function saveGuide(supabase: SupabaseClient, guide: TravelGuide, version: number): Promise<SaveResult> {
  const invalid = validateGuide(guide);
  if (invalid) return { status: 'invalid', reason: invalid };
  const { data, error } = await supabase.from('guides').update(webRow(guide)).eq('id', guide.id).eq('version', version).select('version');
  if (error) return { status: 'error' };
  if (data && data.length > 0) return { status: 'ok', version: (data[0] as { version: number }).version };
  const { data: current, error: readError } = await supabase.from('guides').select('data, version').eq('id', guide.id).maybeSingle();
  if (readError) return { status: 'error' };
  if (!current) return { status: 'denied' };
  const row = current as { data: unknown; version: number };
  if (row.version !== version) return { status: 'conflict', latest: { ...migrate(row.data), id: guide.id }, version: row.version };
  return { status: 'denied' };
}

/** Last save when the tab closes (pagehide): a keepalive request survives the page. */
export function saveOnClose(url: string, key: string, accessToken: string, guide: TravelGuide, version: number): void {
  if (validateGuide(guide)) return;
  const body = JSON.stringify(webRow(guide));
  if (body.length > 60_000) return; // keepalive bodies are limited to 64 KB
  fetch(`${url}/rest/v1/guides?id=eq.${encodeURIComponent(guide.id)}&version=eq.${version}`, {
    method: 'PATCH',
    keepalive: true,
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body,
  }).catch(() => {});
}
