import { unstable_rethrow } from 'next/navigation';

// Walking routes between a day's stops, as in the app (fetchWalkingRoute): the free OSRM server,
// 5 s timeout, nothing over 30 km. null → the map draws a straight dashed line instead.
export type Coord = [lat: number, lng: number];

function km(a: Coord, b: Coord): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const cache = new Map<string, Coord[] | null>();

export async function walkingRoute(coords: Coord[]): Promise<Coord[] | null> {
  if (coords.length < 2) return null;
  const key = coords.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(';');
  if (cache.has(key)) return cache.get(key)!;
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += km(coords[i - 1], coords[i]);
  if (total > 30) return null;
  const path = coords.map(([lat, lng]) => `${lng},${lat}`).join(';');
  try {
    const res = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${path}?overview=full&geometries=geojson`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const line = (await res.json())?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(line) || line.length < 2) return null;
    // Rounded to ~1 m and thinned to at most 400 points: keeps the page small without visible difference.
    const all = (line as [number, number][]).map(([lng, lat]) => [+lat.toFixed(5), +lng.toFixed(5)] as Coord);
    const step = Math.ceil(all.length / 400);
    const result = step > 1 ? all.filter((_, i) => i % step === 0 || i === all.length - 1) : all;
    cache.set(key, result);
    return result;
  } catch (e) {
    unstable_rethrow(e);
    return null;
  }
}
