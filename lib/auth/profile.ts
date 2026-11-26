import type { SupabaseClient, User } from '@supabase/supabase-js';

// The profile row, created the first time someone signs in on the website — exactly as the
// app does (UserContext: upsert with ignoreDuplicates), so app users keep their row untouched.
// Apple sends the name only the first time an Apple ID approves TripShare; with a hidden e-mail
// and no name we ask for one first instead of using the random relay prefix (plan F2.3).
export type ProfileState = 'ok' | 'needsName' | 'error';

export function profileName(user: User): string | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta = [meta.name, meta.full_name].find(v => typeof v === 'string' && v.trim()) as string | undefined;
  if (fromMeta) return fromMeta.trim().slice(0, 40);
  const email = user.email ?? '';
  if (!email || email.endsWith('@privaterelay.appleid.com')) return null;
  return email.split('@')[0].slice(0, 40);
}

export async function ensureProfile(supabase: SupabaseClient, user: User, name?: string): Promise<ProfileState> {
  const { data, error } = await supabase.from('user_profiles').select('id').eq('id', user.id).maybeSingle();
  if (error) return 'error';
  if (data) return 'ok';
  const finalName = name?.trim().slice(0, 40) || profileName(user);
  if (!finalName) return 'needsName';
  const { error: insertError } = await supabase.from('user_profiles').upsert(
    { id: user.id, name: finalName, following: [], upvoted_guides: [], blocked_users: [] },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  return insertError ? 'error' : 'ok';
}
