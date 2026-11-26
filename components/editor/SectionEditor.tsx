'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Core from '../../lib/core/guide';
import type { CustomSection, SectionType, Stop, TravelGuide } from '../../lib/core/guide';
import { useEditor, ui } from './context';
import { Arrows, RemoveButton, TitleInput, AddRow } from './bits';
import PlaceInput, { suggestionText, resolveSuggestion } from './PlaceInput';
import Photos from './Photos';
import { MapButton } from './DayEditor';

// Custom sections (plan D, app CustomSectionCard 913–1386). Every type keeps the app's data
// format exactly; the deviations are listed in plan/06-fase-3-redigering.md.

export const TYPE_KEY: Record<SectionType, string> = {
  list: 'sectionTypeList', checklist: 'sectionTypeList', note: 'sectionTypeNote',
  gallery: 'sectionTypeGallery', map: 'sectionTypeMap', accommodation: 'sectionTypeAccommodation',
};
const MAX_SECTION_PHOTOS = 5;

/** Accommodation photos: the old single accommodationImage counts while images is empty. */
const stayImages = (s: CustomSection) => (s.accommodationImage && s.images.length === 0 ? [s.accommodationImage] : s.images);

export default function SectionEditor({ section, arrows, onRemove }: { section: CustomSection; arrows: React.ReactNode; onRemove: () => void }) {
  const gd = useTranslations('app.guideDetail');
  const { updateSection, addImages } = useEditor();
  const s = section;
  const change = (fn: (x: CustomSection) => CustomSection) => updateSection(s.id, fn);
  const inSection = (g: TravelGuide, fn: (x: CustomSection) => CustomSection) =>
    ({ ...g, customSections: g.customSections.map(x => (x.id === s.id ? fn(x) : x)) });
  const typeLabel = gd(TYPE_KEY[s.type] ?? 'sectionTypeList');
  const isStay = s.type === 'accommodation';

  return (
    <section className={ui.card}>
      <div className="flex items-center gap-3">
        <TitleInput className={`${ui.input} font-display text-lg font-bold`} value={s.title}
          placeholder={isStay ? gd('nameOfAccommodation') : typeLabel}
          onChange={v => change(x => ({ ...x, title: v }))} />
        <span className="hidden shrink-0 rounded-full border border-border px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-faint sm:block">{typeLabel}</span>
        {arrows}
        <RemoveButton onClick={onRemove} />
      </div>

      {s.type === 'list' && (
        <>
          <ul className="mt-4 space-y-2">
            {s.items.map((item, i) => (
              <li key={`${i}-${item}`} className="flex items-center gap-2">
                <Arrows up={i > 0} down={i < s.items.length - 1} onMove={dir => change(x => ({ ...x, items: Core.moveItem(x.items, i, dir) }))} />
                <span className="text-accent">•</span>
                <span className="min-w-0 flex-1 break-words text-sm text-muted">{item}</span>
                <RemoveButton onClick={() => change(x => ({ ...x, items: x.items.filter((_, j) => j !== i) }))} />
              </li>
            ))}
          </ul>
          <AddRow placeholder={gd('addItem')} button={gd('add')} onAdd={v => change(x => ({ ...x, items: [...x.items, v] }))} />
        </>
      )}

      {s.type === 'checklist' && (
        <>
          <ul className="mt-4 space-y-2">
            {s.checklistItems.map((ci, i) => (
              <li key={ci.id} className="flex items-center gap-2">
                <Arrows up={i > 0} down={i < s.checklistItems.length - 1} onMove={dir => change(x => ({ ...x, checklistItems: Core.moveItem(x.checklistItems, i, dir) }))} />
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-[#FF5C38]" checked={ci.checked}
                    onChange={() => change(x => ({ ...x, checklistItems: x.checklistItems.map(c => (c.id === ci.id ? { ...c, checked: !c.checked } : c)) }))} />
                  <span className={`break-words ${ci.checked ? 'text-faint line-through' : 'text-muted'}`}>{ci.text}</span>
                </label>
                <RemoveButton onClick={() => change(x => ({ ...x, checklistItems: x.checklistItems.filter(c => c.id !== ci.id) }))} />
              </li>
            ))}
          </ul>
          <AddRow placeholder={gd('addItem')} button={gd('add')}
            onAdd={v => change(x => ({ ...x, checklistItems: [...x.checklistItems, { id: Core.uid(), text: v, checked: false }] }))} />
        </>
      )}

      {s.type === 'note' && (
        <>
          <textarea className={`${ui.input} mt-4 min-h-[120px] leading-relaxed`} value={s.note} placeholder={gd('writeNotes')}
            onChange={e => { const v = e.target.value; change(x => ({ ...x, note: v })); }} />
          <Photos images={s.images} max={MAX_SECTION_PHOTOS}
            onAdd={files => addImages(files, (g, uris) => inSection(g, x => ({ ...x, images: [...x.images, ...uris].slice(0, MAX_SECTION_PHOTOS) })))}
            onRemove={i => change(x => ({ ...x, images: x.images.filter((_, j) => j !== i) }))} />
        </>
      )}

      {s.type === 'gallery' && (
        <Photos images={s.images}
          onAdd={files => addImages(files, (g, uris) => inSection(g, x => ({ ...x, images: [...x.images, ...uris] })))}
          onRemove={i => change(x => ({ ...x, images: x.images.filter((_, j) => j !== i) }))} />
      )}

      {s.type === 'map' && <MapItems section={s} />}

      {isStay && <Stay section={s} inSection={inSection} />}
    </section>
  );
}

/** Map section: "<address>|||<lat>,<lng>" or "<lat>,<lng>" when picked, free text otherwise. */
function MapItems({ section: s }: { section: CustomSection }) {
  const gd = useTranslations('app.guideDetail');
  const { updateSection, startPick } = useEditor();
  const [text, setText] = useState('');
  const add = (item: string) => updateSection(s.id, x => ({ ...x, items: [...x.items, item] }));
  const addText = () => { const v = text.trim(); if (v) { add(v); setText(''); } };
  return (
    <>
      <ul className="mt-4 space-y-2">
        {s.items.map((item, i) => (
          <li key={`${i}-${item}`} className="flex items-center gap-2">
            <span className="text-accent" aria-hidden>📍</span>
            <span className="min-w-0 flex-1 break-words text-sm text-muted">{item.split('|||')[0]}</span>
            <RemoveButton onClick={() => updateSection(s.id, x => ({ ...x, items: x.items.filter((_, j) => j !== i) }))} />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <PlaceInput className={ui.input} value={text} placeholder={gd('typeAddress')} onChange={setText} onEnter={addText}
          onPick={sug => { add(`${suggestionText(sug)}|||${sug.lat},${sug.lng}`); setText(''); }} />
        <button type="button" onClick={addText} className={`${ui.softButton} shrink-0`}>{gd('add')}</button>
      </div>
      <button type="button" className={`${ui.pill} mt-3`}
        onClick={() => startPick(p => add(p.address ? `${p.address}|||${p.lat},${p.lng}` : `${p.lat},${p.lng}`), true)}>
        📍 {gd('pickOnMap')}
      </button>
    </>
  );
}

/** Accommodation (app 1146–1386): the name is the section title. */
function Stay({ section: s, inSection }: {
  section: CustomSection;
  inSection: (g: TravelGuide, fn: (x: CustomSection) => CustomSection) => TravelGuide;
}) {
  const gd = useTranslations('app.guideDetail');
  const { updateSection, addImages, startPick, mapLang } = useEditor();
  const change = (fn: (x: CustomSection) => CustomSection) => updateSection(s.id, fn);
  const images = stayImages(s);
  const setPlace = (address: string, lat?: number, lng?: number) =>
    change(x => ({ ...x, accommodationAddress: address, accommodationLat: lat, accommodationLng: lng }));

  // Typing clears the coordinates; leaving the field looks the address up when they are missing.
  async function locate() {
    const addr = (s.accommodationAddress ?? '').trim();
    if (!addr || typeof s.accommodationLat === 'number') return;
    const typed = Core.parseCoords(addr);
    let c = typed ? { lat: typed.latitude, lng: typed.longitude } : null;
    if (!c) {
      try {
        const res = await fetch(`/api/geocode?${new URLSearchParams({ q: addr })}`);
        if (res.ok) { const j = await res.json(); c = { lat: j.lat, lng: j.lng }; }
      } catch { /* no coordinates: the public map looks the address up instead */ }
    }
    if (c) change(x => ((x.accommodationAddress ?? '').trim() === addr ? { ...x, accommodationLat: c!.lat, accommodationLng: c!.lng } : x));
  }

  return (
    <div className="mt-4 space-y-3">
      <input className={ui.input} value={s.accommodationUrl ?? ''} placeholder={gd('bookingLink')} inputMode="url" autoCapitalize="none" spellCheck={false}
        onChange={e => { const v = e.target.value; change(x => ({ ...x, accommodationUrl: v })); }} />
      <div className="flex items-center gap-2">
        <PlaceInput className={ui.input} value={s.accommodationAddress ?? ''} placeholder={gd('addressCoords')}
          onChange={v => setPlace(v)} onBlur={() => { void locate(); }}
          onPick={sug => {
            const shown = suggestionText(sug);
            setPlace(shown, sug.lat, sug.lng);
            void resolveSuggestion(sug, mapLang).then(text => {
              if (text !== shown) change(x => (x.accommodationAddress === shown ? { ...x, accommodationAddress: text } : x));
            });
          }} />
        <MapButton onClick={() => startPick(p => setPlace(p.address || `${p.lat},${p.lng}`, p.lat, p.lng), true)} />
      </div>
      <textarea className={`${ui.input} min-h-[80px] text-sm`} value={s.note ?? ''} placeholder={gd('accommodationNotes')}
        onChange={e => { const v = e.target.value; change(x => ({ ...x, note: v })); }} />
      <Photos images={images} max={MAX_SECTION_PHOTOS}
        onAdd={files => addImages(files, (g, uris) => inSection(g, x => ({ ...x, images: [...stayImages(x), ...uris].slice(0, MAX_SECTION_PHOTOS), accommodationImage: '' })))}
        onRemove={i => change(x => ({ ...x, images: stayImages(x).filter((_, j) => j !== i), accommodationImage: '' }))} />
    </div>
  );
}

/** "Add section" (app SectionTypeModal): a new day or one of the five section types. */
export function SectionPicker({ onClose, onAddDay, onAddSection }: {
  onClose: () => void;
  onAddDay: (title: string) => void;
  onAddSection: (title: string, type: SectionType) => void;
}) {
  const gd = useTranslations('app.guideDetail');
  const common = useTranslations('app.common');
  const [type, setType] = useState<'day' | SectionType>('list');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const choices: Array<{ type: 'day' | SectionType; label: string; desc: string; icon: string }> = [
    { type: 'day', label: gd('sectionTypeDay'), desc: gd('sectionTypeDayDesc'), icon: '📅' },
    { type: 'list', label: gd('sectionTypeList'), desc: gd('sectionTypeListDesc'), icon: '≡' },
    { type: 'note', label: gd('sectionTypeNote'), desc: gd('sectionTypeNoteDesc'), icon: '✎' },
    { type: 'gallery', label: gd('sectionTypeGallery'), desc: gd('sectionTypeGalleryDesc'), icon: '▦' },
    { type: 'map', label: gd('sectionTypeMap'), desc: gd('sectionTypeMapDesc'), icon: '🗺' },
    { type: 'accommodation', label: gd('sectionTypeAccommodation'), desc: gd('sectionTypeAccommodationDesc'), icon: '🛏' },
  ];
  const create = () => {
    const v = title.trim();
    if (type === 'accommodation' && !v) return setError(gd('nameRequiredMsg'));
    if (type === 'day') onAddDay(v);
    else onAddSection(v || gd(TYPE_KEY[type]), type);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="picker-title"
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl border border-border bg-surface p-6 shadow-card">
        <h2 id="picker-title" className="font-display text-xl font-bold">{gd('newSection')}</h2>
        <p className={`${ui.label} mt-5`}>{gd('sectionType')}</p>
        <div className="grid grid-cols-2 gap-2">
          {choices.map(c => (
            <button key={c.type} type="button" onClick={() => { setType(c.type); setError(''); }} aria-pressed={type === c.type}
              className={`rounded-2xl border p-3 text-left transition-colors ${type === c.type ? 'border-accent bg-accent/10' : 'border-border hover:bg-s2'}`}>
              <span className="text-lg" aria-hidden>{c.icon}</span>
              <span className={`mt-1 block text-sm font-bold ${type === c.type ? 'text-accent' : 'text-ink'}`}>{c.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-faint">{c.desc}</span>
            </button>
          ))}
        </div>
        <label className={`${ui.label} mt-5`} htmlFor="picker-name">{gd('sectionTitleLabel')}</label>
        <input id="picker-name" className={ui.input} value={title} autoFocus maxLength={200}
          placeholder={type === 'day' ? gd('dayTitlePlaceholder') : type === 'accommodation' ? gd('nameOfAccommodation') : gd(TYPE_KEY[type])}
          onChange={e => { setTitle(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); create(); } }} />
        {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-s2">{common('cancel')}</button>
          <button type="button" onClick={create} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent2">{gd('createSection')}</button>
        </div>
      </div>
    </div>
  );
}

/** The old "Places to visit" list (plan E): only shown when it already has places. */
export function PlacesEditor({ places, onChange }: { places: Stop[]; onChange: (fn: (p: Stop[]) => Stop[]) => void }) {
  const gd = useTranslations('app.guideDetail');
  return (
    <section className={ui.card}>
      <h2 className="font-display text-xl font-bold">{gd('placesToVisit')}</h2>
      <ul className="mt-4 space-y-2">
        {places.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2">
            <Arrows up={i > 0} down={i < places.length - 1} onMove={dir => onChange(list => Core.moveItem(list, i, dir))} />
            <span className="min-w-0 flex-1 break-words text-sm text-muted">{p.name}</span>
            <RemoveButton onClick={() => onChange(list => list.filter(x => x.id !== p.id))} />
          </li>
        ))}
      </ul>
      <AddRow placeholder={gd('addPlace')} button={gd('add')}
        onAdd={name => onChange(list => [...list, { id: Core.uid(), name, notes: '', address: '', images: [] }])} />
    </section>
  );
}
