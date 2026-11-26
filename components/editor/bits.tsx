'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ui } from './context';

export function Arrows({ up, down, onMove }: { up: boolean; down: boolean; onMove: (dir: 1 | -1) => void }) {
  const t = useTranslations('editor');
  const btn = 'flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-ink disabled:opacity-30';
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btn} disabled={!up} onClick={() => onMove(-1)} aria-label={t('moveUp')}>↑</button>
      <button type="button" className={btn} disabled={!down} onClick={() => onMove(1)} aria-label={t('moveDown')}>↓</button>
    </div>
  );
}

export function RemoveButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const t = useTranslations('editor');
  return <button type="button" aria-label={label ?? t('remove')} onClick={onClick} className={ui.x}>✕</button>;
}

/**
 * A title that can't end up empty (app SectionCard.saveTitle): typing saves as you go, and an
 * empty field puts the old title back when it loses focus.
 */
export function TitleInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      className={className}
      value={text}
      placeholder={placeholder}
      maxLength={200}
      onChange={e => { setText(e.target.value); if (e.target.value.trim()) onChange(e.target.value); }}
      onBlur={() => { const v = text.trim(); if (v) { if (v !== value) onChange(v); setText(v); } else setText(value); }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}

/** Text + "Add" button; Enter adds too. Empty text does nothing (app addItem). */
export function AddRow({ placeholder, onAdd, button }: { placeholder: string; onAdd: (text: string) => void; button: string }) {
  const [text, setText] = useState('');
  const add = () => { const v = text.trim(); if (v) { onAdd(v); setText(''); } };
  return (
    <div className="mt-3 flex gap-2">
      <input className={ui.input} value={text} placeholder={placeholder} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      <button type="button" onClick={add} className={`${ui.softButton} shrink-0`}>{button}</button>
    </div>
  );
}
