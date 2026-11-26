import { NextResponse } from 'next/server';

// Protects the map quota: only our own pages may use the map routes, max 30 calls per minute
// per IP (in memory per server instance — a simple brake, not a hard guarantee).
const WINDOW_MS = 60_000;
const MAX_CALLS = 30;
const calls = new Map<string, number[]>();

const ALLOWED_ORIGIN = [
  /^https:\/\/(www\.)?tripshare\.online$/,
  /^https:\/\/[a-z0-9-]+-shanebusiness99-2853s-projects\.vercel\.app$/,
  /^https:\/\/tripshare-web[a-z0-9-]*\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
];

export function allowedOrigin(origin: string | null): boolean {
  return !!origin && ALLOWED_ORIGIN.some(re => re.test(origin));
}

/** The page's origin from Origin, or else Referer. Same-origin GETs often send only Referer. */
export function requestOrigin(req: Request): string | null {
  const origin = req.headers.get('origin');
  if (origin) return origin;
  try { return new URL(req.headers.get('referer') ?? '').origin; } catch { return null; }
}

/** null = go ahead; otherwise the error response to return. */
export function guard(req: Request): NextResponse | null {
  const origin = req.headers.get('origin');
  if (origin && !allowedOrigin(origin)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const now = Date.now();
  const recent = (calls.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_CALLS) {
    return NextResponse.json({ error: 'rateLimited' }, { status: 429, headers: { 'Retry-After': '60' } });
  }
  recent.push(now);
  calls.set(ip, recent);
  if (calls.size > 5000) calls.clear(); // never grow without bound
  return null;
}
