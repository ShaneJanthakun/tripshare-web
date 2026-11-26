import { NextResponse } from 'next/server';
import { signMapsJwt, mapsConfigured } from '../../../lib/geo/jwt';
import { allowedOrigin, requestOrigin } from '../../../lib/geo/guard';

// MapKit JS asks for a token through its authorizationCallback. The token is bound to the page's
// origin (tripshare.online, our Vercel previews or localhost) and lives 30 minutes.
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const origin = requestOrigin(req);
  if (!allowedOrigin(origin)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!mapsConfigured()) return NextResponse.json({ error: 'notConfigured' }, { status: 503 });
  try {
    const { token } = signMapsJwt(origin!);
    return new NextResponse(token, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
  } catch (e) {
    // Never log the key itself — only that signing failed.
    console.error('api/mapkit-token: signing failed:', (e as Error).message);
    return NextResponse.json({ error: 'signingFailed' }, { status: 503 });
  }
}
