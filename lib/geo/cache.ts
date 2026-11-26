import { parseCoords } from '../core/guide';
import { publicClient } from '../supabase/public';
import { createAdminClient } from '../supabase/admin';
import { geocode, type LatLng } from './apple';

// Same query and key as the app (GuideDetailScreen geocodeWithRetry): coordinates in the
// address are used as-is; otherwise ", <country>" is added when the country isn't already in the
// address, and the key is the lower-cased query. Shared through geocode_cache (plan M1).
export function geocodeQuery(address: string, country?: string): { query: string; key: string } {
  let query = address.trim();
  if (country?.trim() && !query.toLowerCase().includes(country.trim().toLowerCase())) {
    query = `${query}, ${country.trim()}`;
  }
  return { query, key: query.toLowerCase() };
}

export type GeoResult = LatLng & { source: 'coords' | 'cache' | 'apple' };

// In memory per server instance, in front of the table: the editor's live map asks for the same
// addresses on every change. Addresses Apple can't find are remembered for an hour, so a typo
// doesn't cost a lookup on every redraw.
const MISS_TTL_MS = 60 * 60 * 1000;
const memory = new Map<string, LatLng>();
const misses = new Map<string, number>();
function remember<K, V>(map: Map<K, V>, key: K, value: V) {
  if (map.size >= 5000) map.clear(); // never grow without bound
  map.set(key, value);
}

export async function geocodeCached(address: string, country?: string, lang?: string): Promise<GeoResult | null> {
  if (!address?.trim()) return null;
  const coords = parseCoords(address);
  if (coords) return { lat: coords.latitude, lng: coords.longitude, source: 'coords' };

  const { query, key } = geocodeQuery(address, country);
  const known = memory.get(key);
  if (known) return { ...known, source: 'cache' };
  if ((misses.get(key) ?? 0) > Date.now()) return null;

  const { data } = await publicClient().from('geocode_cache').select('lat, lng').eq('query', key).maybeSingle();
  const hit = data as { lat: number; lng: number } | null;
  if (hit) {
    console.log(`geocode: cache hit "${key}"`);
    remember(memory, key, { lat: hit.lat, lng: hit.lng });
    return { lat: hit.lat, lng: hit.lng, source: 'cache' };
  }

  let place = await geocode(query, lang);
  // "<place name>, <street>, <city>, <country>" (the editor's suggestions and map clicks): Apple's
  // address lookup sometimes misses because of the name in front, never because of the street.
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (!place && parts.length >= 4) place = await geocode(geocodeQuery(parts.slice(1).join(', '), country).query, lang);
  if (!place) { remember(misses, key, Date.now() + MISS_TTL_MS); return null; }
  remember(memory, key, { lat: place.lat, lng: place.lng });
  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.from('geocode_cache')
      .upsert({ query: key, lat: place.lat, lng: place.lng, provider: 'apple' }, { onConflict: 'query', ignoreDuplicates: true });
    if (error) console.error(`geocode: cache write failed "${key}": ${error.message}`);
  }
  return { lat: place.lat, lng: place.lng, source: 'apple' };
}
