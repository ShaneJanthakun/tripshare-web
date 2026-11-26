'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { renderUrl } from '../../lib/images';
import { imageFiles } from '../../lib/images/upload';
import { useEditor } from './context';

// Photos in a section (plan F): pick several at once, or drag them in from the desktop. A photo
// that is still uploading shows its local preview with a spinner; it is never saved until the
// upload has given it a real URL (guideToRow strips local URIs).

type Props = {
  images: string[];
  /** Max photos (note and accommodation: 5, as in the app). */
  max?: number;
  /** New local preview URIs to add (already cut to the limit). */
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
};

export default function Photos({ images, max = Infinity, onAdd, onRemove }: Props) {
  const t = useTranslations('editor');
  const gd = useTranslations('app.guideDetail');
  const { setError } = useEditor();
  const [over, setOver] = useState(false);
  const room = max - images.length;

  function take(list: FileList | null) {
    const files = imageFiles(list);
    if (!files.length) return;
    if (files.length > room) setError(t('maxPhotos', { max }));
    else setError('');
    if (room > 0) onAdd(files.slice(0, room));
  }

  return (
    <div className="mt-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((uri, i) => {
            const local = !uri.startsWith('https://');
            return (
              <li key={`${uri}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl bg-s2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={local ? uri : renderUrl(uri, 300, 300)} alt="" className="h-full w-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                {local && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40" aria-label={t('uploading')}>
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </span>
                )}
                {!local && (
                  <button type="button" onClick={() => onRemove(i)} aria-label={t('remove')}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-90 hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100">
                    ✕
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {room > 0 ? (
        <label
          onDragOver={e => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-4 py-5 text-center text-sm transition-colors ${
            over ? 'border-accent bg-accent/10 text-ink' : 'border-border text-muted hover:border-accent/50 hover:text-ink'}`}
        >
          <span className="font-semibold">{images.length ? gd('addMore') : gd('addPhotos')}</span>
          <span className="text-xs text-faint">{t('dropPhotos')}</span>
          <input type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={e => { take(e.target.files); e.target.value = ''; }} />
        </label>
      ) : (
        <p className="mt-2 text-xs text-faint">{t('maxPhotos', { max })}</p>
      )}
    </div>
  );
}
