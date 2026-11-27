'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ui } from './context';
import { pastedLines } from './moves';

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

/**
 * Grip for drag and drop (mouse only; phones use the arrows). Holding it makes the card
 * draggable, so text in the card's fields can still be selected normally.
 */
export function DragHandle({ onArm }: { onArm: (on: boolean) => void }) {
  const t = useTranslations('editor');
  return (
    <span aria-hidden title={t('dragHandle')} onMouseDown={() => onArm(true)} onMouseUp={() => onArm(false)} data-drag-handle
      className="hidden h-8 w-5 shrink-0 cursor-grab select-none items-center justify-center text-lg leading-none text-faint hover:text-ink active:cursor-grabbing sm:flex">
      ⠿
    </span>
  );
}

/** Where a dragged item will land. */
export function DropLine({ at }: { at: 'top' | 'bottom' }) {
  return <span className={`pointer-events-none absolute inset-x-0 z-10 h-1 rounded-full bg-accent ${at === 'top' ? '-top-[3px]' : '-bottom-[3px]'}`} />;
}

/** Index to insert at, from the pointer's height over a list of elements. */
export function indexAt(els: Element[], y: number): number {
  for (let i = 0; i < els.length; i++) {
    const r = els[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) return i;
  }
  return els.length;
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

/** Text + "Add" button; Enter adds too. Empty text does nothing (app addItem). Pasting several lines adds one per line. */
export function AddRow({ placeholder, onAdd, button }: { placeholder: string; onAdd: (texts: string[]) => void; button: string }) {
  const [text, setText] = useState('');
  const add = () => { const v = text.trim(); if (v) { onAdd([v]); setText(''); } };
  return (
    <div className="mt-3 flex gap-2" data-native-undo>
      <input className={ui.input} value={text} placeholder={placeholder} onChange={e => setText(e.target.value)}
        onPaste={e => {
          const lines = pastedLines(e.clipboardData.getData('text'));
          if (lines.length < 2) return;
          e.preventDefault();
          onAdd(lines);
        }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      <button type="button" onClick={add} className={`${ui.softButton} shrink-0`}>{button}</button>
    </div>
  );
}
