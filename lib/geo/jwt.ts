import { createPrivateKey, sign } from 'node:crypto';

// ES256 JWT signed with the MapKit key (plan/01-arkitektur.md, Kart og adresser).
// Server only: the private key must never reach the browser.
const LIFETIME_S = 30 * 60;

// Apple Team ID and Key ID are both 10 characters (A–Z, 0–9). Anything else (for example the
// private key pasted into the wrong variable) must never be signed into a token, because the
// token header is public.
const APPLE_ID = /^[A-Z0-9]{10}$/;

export function mapsConfigured(): boolean {
  return APPLE_ID.test(process.env.APPLE_TEAM_ID?.trim() ?? '')
    && APPLE_ID.test(process.env.MAPKIT_KEY_ID?.trim() ?? '')
    && !!process.env.MAPKIT_PRIVATE_KEY;
}

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

/**
 * MAPKIT_PRIVATE_KEY as a PEM, whatever way it was pasted: the whole .p8 file, with literal
 * "\n", in quotes, or only the base64 lines without the BEGIN/END lines.
 */
export function toPem(raw: string): string {
  const v = raw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').trim();
  if (v.includes('-----BEGIN')) return v;
  const body = v.replace(/\s+/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${(body.match(/.{1,64}/g) ?? []).join('\n')}\n-----END PRIVATE KEY-----`;
}

/** origin: set for MapKit JS tokens (the page's origin); omitted for Maps Server API tokens. */
export function signMapsJwt(origin?: string): { token: string; expiresAt: number } {
  const iss = process.env.APPLE_TEAM_ID?.trim() ?? '';
  const kid = process.env.MAPKIT_KEY_ID?.trim() ?? '';
  const pem = process.env.MAPKIT_PRIVATE_KEY;
  if (!pem) throw new Error('MapKit is not configured (MAPKIT_PRIVATE_KEY missing)');
  // Never put the values in the error: they may be secrets in the wrong variable.
  if (!APPLE_ID.test(iss)) throw new Error('APPLE_TEAM_ID is not a 10-character Team ID');
  if (!APPLE_ID.test(kid)) throw new Error('MAPKIT_KEY_ID is not a 10-character Key ID');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + LIFETIME_S;
  const data = `${b64({ alg: 'ES256', kid, typ: 'JWT' })}.${b64({ iss, iat, exp, ...(origin ? { origin } : {}) })}`;
  const key = createPrivateKey(toPem(pem));
  const sig = sign('sha256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return { token: `${data}.${sig}`, expiresAt: exp * 1000 };
}
