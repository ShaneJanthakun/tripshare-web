import { signMapsJwt } from './jwt';

// Apple Maps Server API, called from the server only (plan/01-arkitektur.md).
// Quota (shared with MapKit JS): 25 000 lookups per day. A 429 throws QuotaError, and callers
// show the guide without those pins.
// No cache option on purpose: `cache: 'no-store'` would force the static guide pages to be dynamic.
const API = 'https://maps-api.apple.com/v1';
const TIMEOUT_MS = 5000;

export class QuotaError extends Error {}

export type LatLng = { lat: number; lng: number };
export type Place = LatLng & {
  name: string;
  /** "<name>, <street>, <city>, <region>, <country>" without empty parts (map click → address). */
  address: string;
  street: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
};
export type Suggestion = LatLng & { title: string; subtitle: string };

let access: { token: string; expiresAt: number } | null = null;

async function accessToken(force = false): Promise<string> {
  if (!force && access && access.expiresAt - Date.now() > 60_000) return access.token;
  const res = await fetch(`${API}/token`, {
    headers: { Authorization: `Bearer ${signMapsJwt().token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429) throw new QuotaError('Apple Maps quota reached (token)');
  if (!res.ok) throw new Error(`Apple Maps token: HTTP ${res.status}`);
  const j = await res.json();
  access = { token: j.accessToken, expiresAt: Date.now() + (j.expiresInSeconds ?? 1800) * 1000 };
  return access.token;
}

async function call(path: string, params: Record<string, string | undefined>): Promise<any> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  for (const retry of [false, true]) {
    const res = await fetch(`${API}${path}?${qs}`, {
      headers: { Authorization: `Bearer ${await accessToken(retry)}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 401 && !retry) continue; // token expired early: fetch a new one once
    if (res.status === 429) throw new QuotaError(`Apple Maps quota reached (${path})`);
    if (!res.ok) throw new Error(`Apple Maps ${path}: HTTP ${res.status}`);
    return res.json();
  }
}

function toPlace(r: any): Place | null {
  const c = r?.coordinate;
  if (typeof c?.latitude !== 'number' || typeof c?.longitude !== 'number') return null;
  const a = r.structuredAddress ?? {};
  const street = a.fullThoroughfare ?? [a.subThoroughfare, a.thoroughfare].filter(Boolean).join(' ');
  const city = a.locality ?? a.subLocality ?? '';
  const region = a.administrativeArea ?? '';
  const country = r.country ?? '';
  const name = r.name ?? '';
  const parts = [name, street, city, region, country].map(p => (p ?? '').trim()).filter(Boolean);
  // "Oslo, Oslo, Oslo, Norway" → drop repeats while keeping order.
  const address = parts.filter((p, i) => parts.findIndex(q => q.toLowerCase() === p.toLowerCase()) === i).join(', ');
  return { lat: c.latitude, lng: c.longitude, name, address, street, city, region, country, countryCode: r.countryCode ?? '' };
}

/** Text → first matching place, or null. */
export async function geocode(query: string, lang?: string): Promise<Place | null> {
  const j = await call('/geocode', { q: query, lang });
  return toPlace(j?.results?.[0]);
}

/** Map click → nearest address, or null. */
export async function reverseGeocode(lat: number, lng: number, lang?: string): Promise<Place | null> {
  const j = await call('/reverseGeocode', { loc: `${lat},${lng}`, lang });
  return toPlace(j?.results?.[0]);
}

/** Address suggestions while typing. near = "lat,lng" ranks results around the guide's destination. */
export async function searchAutocomplete(q: string, lang?: string, near?: string): Promise<Suggestion[]> {
  const j = await call('/searchAutocomplete', { q, lang, searchLocation: near, resultTypeFilter: 'Address,Poi' });
  return (j?.results ?? []).flatMap((r: any) => {
    const loc = r.location;
    if (typeof loc?.latitude !== 'number') return [];
    const [title = '', ...rest] = r.displayLines ?? [];
    return [{ title, subtitle: rest.join(', '), lat: loc.latitude, lng: loc.longitude }];
  });
}
