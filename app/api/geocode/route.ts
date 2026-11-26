import { NextResponse } from 'next/server';
import { geocodeCached } from '../../../lib/geo/cache';
import { QuotaError } from '../../../lib/geo/apple';
import { guard } from '../../../lib/geo/guard';

// Text → coordinates: /api/geocode?q=<address>&country=<guide country>&lang=<code>
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const p = new URL(req.url).searchParams;
  const q = (p.get('q') ?? '').slice(0, 300);
  if (!q.trim()) return NextResponse.json({ error: 'missingQuery' }, { status: 400 });
  try {
    const r = await geocodeCached(q, p.get('country') ?? undefined, p.get('lang') ?? undefined);
    if (!r) return NextResponse.json({ error: 'notFound' }, { status: 404 });
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof QuotaError) return NextResponse.json({ error: 'quota' }, { status: 503 });
    console.error('api/geocode:', (e as Error).message);
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
}
