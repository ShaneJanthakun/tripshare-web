'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Core from '../../lib/core/guide';
import type { TripDay, Stop } from '../../lib/core/guide';
import { renderUrl } from '../../lib/images';
import { dayColor } from '../../lib/guides/model';
import { useEditor, ui } from './context';
import { Arrows, RemoveButton } from './bits';
import PlaceInput, { suggestionText, resolveSuggestion, type Suggestion } from './PlaceInput';

// One day (plan C): name, route switch, stops with name/address/notes, and new stops by
// typing, by picking a suggestion, or by clicking on the map.

export default function DayEditor({ day, index, arrows, onRemove }: {
  day: TripDay; index: number; arrows: React.ReactNode; onRemove: () => void;
}) {
  const gd = useTranslations('app.guideDetail');
  const t = useTranslations('editor');
  const { updateDay, startPick, mapLang } = useEditor();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const color = dayColor(index);

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

  return (
    <section className={ui.card}>
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
        <input className={`${ui.input} font-display text-lg font-bold`} value={day.label} maxLength={200}
          onChange={e => change(d => ({ ...d, label: e.target.value }))}
          onBlur={e => { if (!e.target.value.trim()) change(d => ({ ...d, label: gd('dayN', { n: index + 1 }) })); }} />
        {arrows}
        <RemoveButton onClick={onRemove} label={gd('removeDay')} />
      </div>

      {day.stops.length >= 2 && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="accent-[#FF5C38]" checked={day.showRoute !== false}
            onChange={e => change(d => ({ ...d, showRoute: e.target.checked }))} />
          {gd('showRouteOnMap')}
        </label>
      )}

      <ol className="mt-4 space-y-3">
        {day.stops.map((s, i) => (
          <li key={s.id} className="rounded-2xl border border-border bg-bg/40 p-3">
            <div className="flex items-center gap-2">
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

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        {/* Picking a suggestion in the name field adds the stop with its address straight away. */}
        <PlaceInput className={ui.input} value={name} placeholder={gd('addPlaceName')} dataRole="new-stop-name"
          onChange={setName} onEnter={addStop}
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
