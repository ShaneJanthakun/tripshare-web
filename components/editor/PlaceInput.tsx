'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useEditor } from './context';

// Address field with suggestions from Apple (/api/places), as PlaceAutocomplete in the app.
// The chosen suggestion is saved as text: "<title>, <subtitle>" — the same shape as the app's
// "<name street>, <city>, <country>". ↑↓ and Enter pick with the keyboard, Esc closes.

export type Suggestion = { title: string; subtitle: string; lat: number; lng: number };
export const suggestionText = (s: Suggestion) => {
  const sub = s.subtitle?.trim() ?? '';
  const title = s.title.trim();
  // Apple sometimes repeats the title at the start of the subtitle.
  const repeats = sub.toLowerCase() === title.toLowerCase() || sub.toLowerCase().startsWith(`${title.toLowerCase()},`);
  return repeats ? sub : [title, sub].filter(Boolean).join(', ');
};

/**
 * The text to save for a suggestion. A place without a street ("Fløibanen" / "Bergen, Norge")
 * can't be found again by the address lookup that draws the maps, so its street is looked up
 * from the suggestion's coordinates: "Fløibanen, Vetrlidsallmenningen 21, Bergen, Norge".
 */
export async function resolveSuggestion(s: Suggestion, lang: string): Promise<string> {
  const plain = suggestionText(s);
  const isAddress = /\d/.test(s.title) || (s.subtitle ?? '').split(',').length >= 3;
  if (isAddress) return plain;
  try {
    const res = await fetch(`/api/reverse?${new URLSearchParams({ lat: String(s.lat), lng: String(s.lng), lang })}`);
    if (!res.ok) return plain;
    const p = await res.json();
    if (!p?.street) return plain;
    const parts = [s.title, p.street, p.city || p.region, p.country].map((x: string) => (x ?? '').trim()).filter(Boolean);
    return parts.filter((x, i) => parts.findIndex(y => y.toLowerCase() === x.toLowerCase()) === i).join(', ');
  } catch {
    return plain;
  }
}

type Props = {
  value: string;
  onChange: (text: string) => void;
  /** A suggestion was chosen. Default: the text goes into the field. */
  onPick?: (s: Suggestion) => void;
  /** Enter without a highlighted suggestion. */
  onEnter?: () => void;
  onBlur?: () => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  dataRole?: string;
  id?: string;
};

export default function PlaceInput({ value, onChange, onPick, onEnter, onBlur, onPaste, placeholder, className, dataRole, id }: Props) {
  const { near, mapLang } = useEditor();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ctrl = useRef<AbortController | null>(null);
  const listId = useId();
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => () => { clearTimeout(timer.current); ctrl.current?.abort(); }, []);

  function search(text: string) {
    clearTimeout(timer.current);
    ctrl.current?.abort();
    if (text.trim().length < 2) { setItems([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const c = new AbortController();
      ctrl.current = c;
      try {
        const qs = new URLSearchParams({ q: text, lang: mapLang });
        if (near) qs.set('near', near);
        const res = await fetch(`/api/places?${qs}`, { signal: c.signal });
        if (!res.ok) return;
        const seen = new Set<string>();
        const next = ((await res.json()).results as Suggestion[] ?? []).filter(s => {
          const k = suggestionText(s).toLowerCase();
          if (!s.title || seen.has(k)) return false;
          seen.add(k);
          return true;
        }).slice(0, 6);
        setItems(next);
        setHi(-1);
        setOpen(next.length > 0);
      } catch { /* aborted or offline: no suggestions */ }
    }, 300);
  }

  function pick(s: Suggestion) {
    clearTimeout(timer.current);
    ctrl.current?.abort();
    setItems([]);
    setOpen(false);
    if (onPick) return onPick(s);
    // Shown at once; the street is filled in a moment later, unless the user typed meanwhile.
    const shown = suggestionText(s);
    onChange(shown);
    void resolveSuggestion(s, mapLang).then(text => { if (text !== shown && valueRef.current === shown) onChange(text); });
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
        value={value}
        placeholder={placeholder}
        data-role={dataRole}
        onPaste={onPaste}
        onChange={e => { onChange(e.target.value); search(e.target.value); }}
        onKeyDown={e => {
          if (open && items.length) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => (h + 1) % items.length); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => (h <= 0 ? items.length - 1 : h - 1)); return; }
            if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
            if (e.key === 'Enter' && hi >= 0) { e.preventDefault(); pick(items[hi]); return; }
          }
          if (e.key === 'Enter') {
            clearTimeout(timer.current);
            ctrl.current?.abort();
            setOpen(false);
            if (onEnter) { e.preventDefault(); onEnter(); }
          }
        }}
        onFocus={() => { if (items.length) setOpen(true); }}
        onBlur={() => { setTimeout(() => setOpen(false), 120); onBlur?.(); }}
      />
      {open && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-s2 py-1 shadow-card">
          {items.map((s, i) => (
            <li key={`${s.title}-${i}`} role="option" aria-selected={i === hi}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()} // keep focus in the field
                onClick={() => pick(s)}
                className={`flex w-full items-start gap-2.5 px-4 py-2 text-left ${i === hi ? 'bg-accent/15' : 'hover:bg-surface'}`}
              >
                <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{s.title}</span>
                  {s.subtitle && <span className="block truncate text-xs text-faint">{s.subtitle}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
