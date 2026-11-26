import { unstable_rethrow } from 'next/navigation';
import { type TravelGuide, parseCoords } from '../core/guide';
import { geocodeCached } from '../geo/cache';
import { mapsConfigured } from '../geo/jwt';
import { walkingRoute, type Coord } from '../geo/routes';
import { dayColor, STAY_COLOR } from './model';

// Map data for a guide, computed on the server during ISR and passed to <GuideMap> as props
// (plan/04-fase-1-guidesider.md, "Kart"). Mirrors the app's MapTab, with two fixes: the map is
// shown with the stops even when the destination can't be found, and addresses that can't be
// found are counted and logged.

export type MapPin = {
  lat: number; lng: number;
  kind: 'stop' | 'stay' | 'place';
  label: string;    // number on the pin ('' for stays)
  title: string;    // shown on click
  subtitle: string;
  group: number;    // day index in guide.days, days.length + n for map sections, -1 for stays
};
export type MapGroup = { group: number; label: string; color: string; kind: 'day' | 'section' };
export type MapLine = { group: number; coords: Coord[]; dashed: boolean };
export type GuideMapData = { pins: MapPin[]; lines: MapLine[]; groups: MapGroup[]; center: Coord | null; missing: number };
export type MiniMapData = { pins: MapPin[]; center: Coord | null };

const LIMIT = 6; // parallel lookups: Apple throttles bursts

async function pool<T, R>(items: T[], fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(LIMIT, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

async function locate(address: string, country: string): Promise<Coord | null> {
  const c = parseCoords(address ?? '');
  if (c) return [c.latitude, c.longitude];
  if (!address?.trim() || !mapsConfigured()) return null;
  try {
    const r = await geocodeCached(address, country);
    return r ? [r.lat, r.lng] : null;
  } catch (e) {
    unstable_rethrow(e); // never swallow Next's own signals (dynamic usage, redirects)
    console.error(`map: lookup failed "${address}": ${(e as Error).message}`);
    return null;
  }
}

/** "name|||lat,lng" (picked on the map) → name and coordinates; anything else → text only. */
function splitMapItem(item: string): { name: string; coord: Coord | null } {
  const [name, coords] = String(item).split('|||');
  const c = coords ? parseCoords(coords) : null;
  return { name: (name ?? '').trim(), coord: c ? [c.latitude, c.longitude] : null };
}

export async function buildGuideMap(g: TravelGuide): Promise<GuideMapData> {
  const country = g.country ?? '';
  const days = g.days ?? [];
  const groups: MapGroup[] = days.map((d, i) => ({ group: i, label: d.label, color: dayColor(i), kind: 'day' }));
  let missing = 0;

  // Stops, numbered by their place in the day (gaps where a stop has no address, as in the app).
  const stopJobs = days.flatMap((d, di) => (d.stops ?? []).map((s, si) => ({ d, di, s, si })).filter(j => j.s.address?.trim()));
  const stopCoords = await pool(stopJobs, j => locate(j.s.address, country));
  const pins: MapPin[] = [];
  stopJobs.forEach((j, k) => {
    const c = stopCoords[k];
    if (!c) { missing++; return; }
    pins.push({ lat: c[0], lng: c[1], kind: 'stop', label: String(j.si + 1), title: j.s.name || j.s.address, subtitle: j.d.label, group: j.di });
  });

  // Accommodation: stored coordinates when both exist, otherwise the address.
  const stays = (g.customSections ?? []).filter(s => s.type === 'accommodation');
  const stayCoords = await pool(stays, async s =>
    typeof s.accommodationLat === 'number' && typeof s.accommodationLng === 'number'
      ? ([s.accommodationLat, s.accommodationLng] as Coord)
      : s.accommodationAddress?.trim() ? locate(s.accommodationAddress, country) : null);
  stays.forEach((s, k) => {
    const c = stayCoords[k];
    if (c) pins.push({ lat: c[0], lng: c[1], kind: 'stay', label: '', title: s.accommodationName || s.title, subtitle: '', group: -1 });
    else if (s.accommodationAddress?.trim()) missing++;
  });

  // Map sections: only items picked on the map ("name|||lat,lng") go on the main map.
  const mapSections = (g.customSections ?? []).filter(s => s.type === 'map');
  mapSections.forEach((s, n) => {
    const group = days.length + n;
    groups.push({ group, label: s.title, color: dayColor(group), kind: 'section' });
    let i = 0;
    for (const item of s.items ?? []) {
      const { name, coord } = splitMapItem(item);
      if (coord) pins.push({ lat: coord[0], lng: coord[1], kind: 'place', label: String(++i), title: name, subtitle: s.title, group });
    }
  });

  // Routes: per day with at least two pins when showRoute !== false; map sections always.
  const lineJobs = groups.flatMap(gr => {
    if (gr.kind === 'day' && days[gr.group]?.showRoute === false) return [];
    const coords = pins.filter(p => p.group === gr.group).map(p => [p.lat, p.lng] as Coord);
    return coords.length >= 2 ? [{ group: gr.group, coords }] : [];
  });
  const lines = await pool(lineJobs, async j => {
    const route = await walkingRoute(j.coords);
    return { group: j.group, coords: route ?? j.coords, dashed: !route };
  });

  const usedGroups = new Set(pins.map(p => p.group));
  const center = pins.length ? null : await locate([g.destination, country].filter(Boolean).join(', '), '');
  if (missing) console.log(`map: ${g.id}: ${missing} address(es) not found`);
  return { pins, lines, groups: groups.filter(gr => usedGroups.has(gr.group)), center, missing };
}

/** The small map in a map section: every item, looked up when it has no coordinates. */
export async function buildMiniMap(items: string[], g: TravelGuide): Promise<MiniMapData> {
  const parsed = (items ?? []).map(splitMapItem);
  const coords = await pool(parsed, p => (p.coord ? Promise.resolve(p.coord) : locate(p.name, g.country ?? '')));
  const pins: MapPin[] = [];
  parsed.forEach((p, i) => {
    const c = coords[i];
    if (c) pins.push({ lat: c[0], lng: c[1], kind: 'place', label: String(pins.length + 1), title: p.name, subtitle: '', group: 0 });
  });
  return { pins, center: null };
}
