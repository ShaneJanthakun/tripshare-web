import { NextResponse } from 'next/server';
import { searchAutocomplete, QuotaError } from '../../../lib/geo/apple';
import { guard } from '../../../lib/geo/guard';

// Address suggestions while typing: /api/places?q=<text>&lang=<code>&near=<lat,lng>
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const p = new URL(req.url).searchParams;
  const q = (p.get('q') ?? '').slice(0, 200);
  if (q.trim().length < 2) return NextResponse.json({ results: [] });
  const near = p.get('near');
  try {
    const results = await searchAutocomplete(q, p.get('lang') ?? undefined, near && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(near) ? near : undefined);
    return NextResponse.json({ results });
  } catch (e) {
    if (e instanceof QuotaError) return NextResponse.json({ error: 'quota' }, { status: 503 });
    console.error('api/places:', (e as Error).message);
    return NextResponse.json({ error: 'failed' }, { status: 502 });
  }
}
