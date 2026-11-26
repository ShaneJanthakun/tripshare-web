'use client';

import { createContext, useContext } from 'react';
import type { TravelGuide, TripDay, CustomSection } from '../../lib/core/guide';

// What every part of the editor shares. All changes go through functional updates on the latest
// guide, so an upload or a map click that finishes later never overwrites newer edits.

export type PickedPlace = { lat: number; lng: number; address: string };

export type EditorApi = {
  locale: string;
  /** Language for Apple's address search ("no" → "nb"). */
  mapLang: string;
  /** "lat,lng" of the destination: address suggestions are ranked around it. */
  near: string | undefined;
  update: (fn: (g: TravelGuide) => TravelGuide) => void;
  updateDay: (id: string, fn: (d: TripDay) => TripDay) => void;
  updateSection: (id: string, fn: (s: CustomSection) => CustomSection) => void;
  /** Shows the files at once (local preview), uploads them and swaps in the URLs. */
  addImages: (files: File[], apply: (g: TravelGuide, uris: string[]) => TravelGuide) => void;
  /** The next click on the map gives a place (with the address when one is found). */
  startPick: (onPlace: (p: PickedPlace) => void, allowNoAddress?: boolean) => void;
  setError: (msg: string) => void;
};

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const api = useContext(EditorContext);
  if (!api) throw new Error('useEditor outside <Editor>');
  return api;
}

export const ui = {
  input: 'w-full rounded-xl border border-border bg-s2 px-4 py-2.5 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-accent/60',
  label: 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-faint',
  card: 'rounded-3xl border border-border bg-surface p-5 sm:p-6',
  softButton: 'rounded-xl bg-accent/15 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-accent/25',
  pill: 'inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-semibold text-ink hover:bg-accent/20',
  x: 'px-2 text-faint hover:text-ink',
};
