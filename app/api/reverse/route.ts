import { NextResponse } from 'next/server';
import { reverseGeocode, QuotaError } from '../../../lib/geo/apple';
import { guard } from '../../../lib/geo/guard';

// Map click → address: /api/reverse?lat=<lat>&lng=<lng>&lang=<code>
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const p = new URL(req.url).searchParams;
  const lat = Number(p.get('lat'));
  const lng = Number(p.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'badCoordinates' }, { status: 400 });
  }
  try {
    const place = await reverseGeocode(lat, lng, p.get('lang') ?? undefined);
    // No address (e.g. open sea): the editor shows a message instead of creating an empty stop.
    if (!place?.address) return NextResponse.json({ error: 'notFound' }, { status: 404 });
    return NextResponse.json(place);
  } catch (e) {
    if (e instanceof QuotaError) return NextResponse.json({ error: 'quota' }, { status: 503 });
    console.error('api/reverse:', (e as Error).message);
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
}
