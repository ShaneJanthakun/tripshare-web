import * as Core from '../../lib/core/guide';
import type { TravelGuide, Stop } from '../../lib/core/guide';

// Web-only editing helpers (plan 06, part 3). They live here, not in lib/core/guide.ts, because
// that file is a generated copy of the app's core. They only rearrange existing data: the guide
// format is unchanged.

/** Move a stop to position toIndex in a day (also another day). toIndex counts the stop itself. */
export function moveStop(g: TravelGuide, fromDayId: string, stopId: string, toDayId: string, toIndex: number): TravelGuide {
  const from = g.days.find(d => d.id === fromDayId);
  const stop = from?.stops.find(s => s.id === stopId);
  if (!from || !stop || !g.days.some(d => d.id === toDayId)) return g;
  let index = toIndex;
  if (fromDayId === toDayId) {
    const current = from.stops.findIndex(s => s.id === stopId);
    if (current < index) index--;
    if (current === index) return g;
  }
  const without = g.days.map(d => (d.id === fromDayId ? { ...d, stops: d.stops.filter(s => s.id !== stopId) } : d));
  return {
    ...g,
    days: without.map(d => (d.id === toDayId ? { ...d, stops: [...d.stops.slice(0, index), stop, ...d.stops.slice(index)] } : d)),
  };
}

/** Move a day or section to position `to` in the shared order (sectionOrder). */
export function moveBlockTo(g: TravelGuide, from: number, to: number): TravelGuide {
  const order = [...Core.getOrder(g)];
  let target = from < to ? to - 1 : to;
  target = Math.max(0, Math.min(order.length - 1, target));
  if (from === target || !order[from]) return g;
  const [entry] = order.splice(from, 1);
  order.splice(target, 0, entry);
  return { ...g, sectionOrder: order };
}

/** A copy of a day right after it, with new ids for the day and its stops (photos are shared). */
export function duplicateDay(g: TravelGuide, dayId: string, label: string): TravelGuide {
  const i = g.days.findIndex(d => d.id === dayId);
  if (i < 0) return g;
  const day = g.days[i];
  const copy = { ...day, id: Core.uid(), label, stops: day.stops.map(s => ({ ...s, id: Core.uid(), images: [...s.images] })) };
  const days = [...g.days.slice(0, i + 1), copy, ...g.days.slice(i + 1)];
  const order = [...Core.getOrder(g)];
  const at = order.findIndex(e => e.kind === 'day' && e.id === dayId);
  order.splice(at + 1, 0, { kind: 'day', id: copy.id });
  return { ...g, days, sectionOrder: order };
}

/** Pasted text → one entry per line, without list bullets or numbers ("- ", "• ", "3. "). */
export function pastedLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*(?:[-*•·–—]|\d{1,3}[.)])\s+/, '').trim())
    .filter(Boolean);
}

/** Pasted lines as new stops. A tab splits name and address (rows copied from a spreadsheet). */
export function stopsFromLines(lines: string[]): Stop[] {
  return lines.flatMap(line => {
    const [name = '', address = ''] = line.split('\t').map(x => x.trim());
    return name ? [{ id: Core.uid(), name, notes: '', address, images: [] }] : [];
  });
}
