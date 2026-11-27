import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { migrate } from '../../../lib/core/guide';
import { buildGuideMap } from '../../../lib/guides/mapdata';
import { guard } from '../../../lib/geo/guard';

// The editor's live map (plan F3.3): the editor sends the map-relevant part of the guide being
// edited, and gets back exactly what the public page would draw (same buildGuideMap).
// Signed-in users only; at most 300 places per request to protect the map quota.
export const dynamic = 'force-dynamic';
const MAX_BODY = 200_000;
const MAX_PLACES = 300;

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const text = await req.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: 'tooLarge' }, { status: 413 });
  let g: ReturnType<typeof migrate>;
  let places: number;
  try {
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not an object');
    g = migrate(raw);
    places = g.days.reduce((n, d) => n + d.stops.length, 0)
      + g.customSections.reduce((n, s) => n + (s.type === 'map' ? s.items.length : s.type === 'accommodation' ? 1 : 0), 0);
  } catch {
    return NextResponse.json({ error: 'badRequest' }, { status: 400 });
  }
  if (places > MAX_PLACES) return NextResponse.json({ error: 'tooMany' }, { status: 413 });

  return NextResponse.json(await buildGuideMap(g));
}
