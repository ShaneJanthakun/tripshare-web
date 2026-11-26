'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Core from '../../lib/core/guide';
import type { TripDay, Stop } from '../../lib/core/guide';
import { renderUrl } from '../../lib/images';
import { dayColor } from '../../lib/guides/model';
import { useEditor, ui } from './context';
import { Arrows, RemoveButton, DragHandle, DropLine, indexAt } from './bits';
import { moveStop, pastedLines, stopsFromLines } from './moves';
import PlaceInput, { suggestionText, resolveSuggestion, type Suggestion } from './PlaceInput';

// One day (plan C): name, route switch, stops with name/address/notes, and new stops by
// typing, by picking a suggestion, by clicking on the map or by pasting a list. Stops can be
// dragged to another place in the day or to another day.

export default function DayEditor({ day, index, arrows, onRemove, onDuplicate }: {
  day: TripDay; index: number; arrows: React.ReactNode; onRemove: () => void; onDuplicate: () => void;
}) {
  const gd = useTranslations('app.guideDetail');
  const t = useTranslations('editor');
  const { update, updateDay, startPick, mapLang, drag, setDrag } = useEditor();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [armed, setArmed] = useState<string | null>(null); // stop whose grip is held
  const [over, setOver] = useState<number | null>(null);   // drop position in this day
  const list = useRef<HTMLOListElement>(null);
  const color = dayColor(index);
  const stopEls = () => Array.from(list.current?.querySelectorAll(':scope > li[data-stop]') ?? []);

  const change = (fn: (d: TripDay) => TripDay) => updateDay(day.id, fn);
  const setStop = (id: string, patch: Partial<Stop>) => change(d => ({ ...d, stops: d.stops.map(s => (s.id === id ? { ...s, ...patch } : s)) }));
  const push = (n: string, a: string) => {
    const id = Core.uid();
    change(d => ({ ...d, stops: [...d.stops, { id, name: n, notes: '', address: a, images: [] }] }));
    return id;
  };
  // A suggestion becomes a stop at once; its street is filled in when found (resolveSuggestion).
  const pushSuggestion = (sug: Suggestion) => {
    const shown = suggestionText(sug);
    const id = push(sug.title, shown);
    void resolveSuggestion(sug, mapLang).then(text => {
      if (text !== shown) change(d => ({ ...d, stops: d.stops.map(x => (x.id === id && x.address === shown ? { ...x, address: text } : x)) }));
    });
  };

  const addStop = () => {
    const n = name.trim();
    if (!n) return; // a stop needs a name (app: GuideDetailScreen 515–522)
    push(n, address.trim());
    setName('');
    setAddress('');
  };

  // Stop from the map (app 578): the name is the first part of the address.
  const fromMap = () => startPick(p => push(p.address.split(',')[0].trim() || p.address, p.address));

  // Several lines pasted into the name field: one stop per line ("name<TAB>address" from a sheet).
  const pasteStops = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const lines = pastedLines(e.clipboardData.getData('text'));
    if (lines.length < 2) return;
    e.preventDefault();
    const stops = stopsFromLines(lines);
    change(d => ({ ...d, stops: [...d.stops, ...stops] }));
    setName('');
  };

  const dragging = drag?.kind === 'stop';
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (!dragging) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setOver(indexAt(stopEls(), e.clientY));
    },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); },
    onDrop: (e: React.DragEvent) => {
      if (drag?.kind !== 'stop') return;
      e.preventDefault();
      e.stopPropagation();
      const to = indexAt(stopEls(), e.clientY);
      update(g => moveStop(g, drag.dayId, drag.stopId, day.id, to));
      setOver(null);
      setDrag(null);
    },
  };

  return (
    <section className={ui.card} {...dropHandlers}>
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
        <input className={`${ui.input} font-display text-lg font-bold`} value={day.label} maxLength={200}
          onChange={e => change(d => ({ ...d, label: e.target.value }))}
          onBlur={e => { if (!e.target.value.trim()) change(d => ({ ...d, label: gd('dayN', { n: index + 1 }) })); }} />
        {arrows}
        <button type="button" onClick={onDuplicate} title={t('duplicateDay')} aria-label={t('duplicateDay')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-ink">⧉</button>
        <RemoveButton onClick={onRemove} label={gd('removeDay')} />
      </div>

      {day.stops.length >= 2 && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="accent-[#FF5C38]" checked={day.showRoute !== false}
            onChange={e => change(d => ({ ...d, showRoute: e.target.checked }))} />
          {gd('showRouteOnMap')}
        </label>
      )}

      <ol ref={list} className={`mt-4 space-y-3 ${dragging && day.stops.length === 0 ? 'min-h-[56px] rounded-2xl border border-dashed border-accent/50' : ''}`}>
        {day.stops.map((s, i) => (
          <li key={s.id} data-stop draggable={armed === s.id}
            onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', s.name); setDrag({ kind: 'stop', dayId: day.id, stopId: s.id }); }}
            onDragEnd={() => { setArmed(null); setOver(null); setDrag(null); }}
            className={`relative rounded-2xl border border-border bg-bg/40 p-3 ${drag?.kind === 'stop' && drag.stopId === s.id ? 'opacity-40' : ''}`}>
            {over === i && <DropLine at="top" />}
            {over === day.stops.length && i === day.stops.length - 1 && <DropLine at="bottom" />}
            <div className="flex items-center gap-2">
              <DragHandle onArm={on => setArmed(on ? s.id : null)} />
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: color }}>{i + 1}</span>
              <input className={ui.input} value={s.name} placeholder={t('stopName')} onChange={e => setStop(s.id, { name: e.target.value })} />
              <Arrows up={i > 0} down={i < day.stops.length - 1} onMove={dir => change(d => ({ ...d, stops: Core.moveItem(d.stops, i, dir) }))} />
              <RemoveButton onClick={() => change(d => ({ ...d, stops: d.stops.filter(x => x.id !== s.id) }))} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <PlaceInput className={`${ui.input} text-sm`} value={s.address} placeholder={gd('addAddressOptional')}
                onChange={v => setStop(s.id, { address: v })} />
              <MapButton onClick={() => startPick(p => setStop(s.id, { address: p.address }))} />
            </div>
            <textarea className={`${ui.input} mt-2 min-h-[70px] text-sm`} value={s.notes} placeholder={gd('addNotes')}
              onChange={e => setStop(s.id, { notes: e.target.value })} />
            {/* Stop photos: shown as in the app (72 px); the app has no way to add them either. */}
            {s.images.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {s.images.map(uri => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={uri} src={renderUrl(uri, 150, 150)} alt="" className="h-[72px] w-[72px] shrink-0 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
      {day.stops.length === 0 && <p className="mt-3 text-sm text-faint">{gd('noStopsYet')}</p>}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]" data-native-undo>
        {/* Picking a suggestion in the name field adds the stop with its address straight away. */}
        <PlaceInput className={ui.input} value={name} placeholder={gd('addPlaceName')} dataRole="new-stop-name"
          onChange={setName} onEnter={addStop} onPaste={pasteStops}
          onPick={sug => { pushSuggestion(sug); setName(''); setAddress(''); }} />
        <PlaceInput className={ui.input} value={address} placeholder={gd('addAddressOptional')} dataRole="new-stop-address"
          onChange={setAddress} onEnter={addStop} />
        <MapButton onClick={fromMap} large />
        <button type="button" onClick={addStop} className={ui.softButton}>+ {t('addStop')}</button>
      </div>
    </section>
  );
}

export function MapButton({ onClick, large = false }: { onClick: () => void; large?: boolean }) {
  const gd = useTranslations('app.guideDetail');
  return (
    <button type="button" onClick={onClick} title={gd('pickOnMap')} aria-label={gd('pickOnMap')}
      className={`flex shrink-0 items-center justify-center rounded-xl border border-border text-accent hover:bg-s2 ${large ? 'h-[46px] px-4' : 'h-10 w-10'}`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <circle cx="12" cy="12" r="8" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    </button>
  );
}
