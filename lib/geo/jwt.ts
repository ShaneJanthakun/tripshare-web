import { createPrivateKey, sign } from 'node:crypto';

// ES256 JWT signed with the MapKit key (plan/01-arkitektur.md, Kart og adresser).
// Server only: the private key must never reach the browser.
const LIFETIME_S = 30 * 60;

export function mapsConfigured(): boolean {
  return !!(process.env.APPLE_TEAM_ID && process.env.MAPKIT_KEY_ID && process.env.MAPKIT_PRIVATE_KEY);
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
  const iss = process.env.APPLE_TEAM_ID;
  const kid = process.env.MAPKIT_KEY_ID;
  const pem = process.env.MAPKIT_PRIVATE_KEY;
  if (!iss || !kid || !pem) throw new Error('MapKit is not configured (APPLE_TEAM_ID, MAPKIT_KEY_ID, MAPKIT_PRIVATE_KEY)');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + LIFETIME_S;
  const data = `${b64({ alg: 'ES256', kid, typ: 'JWT' })}.${b64({ iss, iat, exp, ...(origin ? { origin } : {}) })}`;
  const key = createPrivateKey(toPem(pem));
  const sig = sign('sha256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return { token: `${data}.${sig}`, expiresAt: exp * 1000 };
}
