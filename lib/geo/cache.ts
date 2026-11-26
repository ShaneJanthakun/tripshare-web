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

export async function geocodeCached(address: string, country?: string, lang?: string): Promise<GeoResult | null> {
  if (!address?.trim()) return null;
  const coords = parseCoords(address);
  if (coords) return { lat: coords.latitude, lng: coords.longitude, source: 'coords' };

  const { query, key } = geocodeQuery(address, country);
  const { data } = await publicClient().from('geocode_cache').select('lat, lng').eq('query', key).maybeSingle();
  const hit = data as { lat: number; lng: number } | null;
  if (hit) {
    console.log(`geocode: cache hit "${key}"`);
    return { lat: hit.lat, lng: hit.lng, source: 'cache' };
  }

  const place = await geocode(query, lang);
  if (!place) return null;
  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.from('geocode_cache')
      .upsert({ query: key, lat: place.lat, lng: place.lng, provider: 'apple' }, { onConflict: 'query', ignoreDuplicates: true });
    if (error) console.error(`geocode: cache write failed "${key}": ${error.message}`);
  }
  return { lat: place.lat, lng: place.lng, source: 'apple' };
}
