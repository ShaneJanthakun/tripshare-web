import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '../../../../../lib/supabase/server';
import { migrate, ADMIN_USER_ID } from '../../../../../lib/core/guide';
import { guideLocale, guidePath } from '../../../../../lib/guides/model';

// After a save from the editor: rebuild the public guide page now instead of within 10 minutes
// (plan F3.2). Only the author or admin may trigger it.
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data } = await supabase.from('guides').select('author_id, data').eq('id', id).maybeSingle();
  const row = data as { author_id: string; data: unknown } | null;
  if (!row || (row.author_id !== user.id && user.id !== ADMIN_USER_ID)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const g = { ...migrate(row.data), id };
  revalidatePath(guidePath(guideLocale(g), g));
  revalidatePath('/[locale]/guides', 'page');
  return NextResponse.json({ ok: true });
}
