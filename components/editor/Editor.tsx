'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '../../lib/supabase/client';
import { saveGuide, saveOnClose, type SaveResult } from '../../lib/guides/save';
import { uploadImage } from '../../lib/images/upload';
import { renderUrl } from '../../lib/images';
import * as Core from '../../lib/core/guide';
import type { TravelGuide, TripDay, Stop, GuideTag, CustomSection } from '../../lib/core/guide';

// The web editor (plan 06, phase 3). Same behaviour as the app's GuideDetailScreen in edit mode,
// built on the shared core, so the app and the website write exactly the same guide format.
// Autosave 800 ms after the last change and when the tab is hidden; conflicts are detected
// with the row's version (data contract 4).

type Status = 'saved' | 'dirty' | 'saving' | 'error' | 'invalid' | 'denied';
type Conflict = Extract<SaveResult, { status: 'conflict' }>;
const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

type Props = {
  locale: string;
  initialGuide: TravelGuide;
  initialVersion: number;
  publicPath: string;
  supabaseUrl: string;
  supabaseKey: string;
};

export default function Editor({ locale, initialGuide, initialVersion, publicPath, supabaseUrl, supabaseKey }: Props) {
  const t = useTranslations('editor');
  const gd = useTranslations('app.guideDetail');
  const cg = useTranslations('app.createGuide');
  const common = useTranslations('app.common');
  const tagT = useTranslations('app.tags');

  const supabase = useRef(createClient()).current;
  const [guide, setGuide] = useState(initialGuide);
  const latest = useRef(initialGuide);
  const version = useRef(initialVersion);
  const dirty = useRef(false);
  const saving = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useRef<string | null>(null);
  const lastRevalidate = useRef(0);
  const [status, setStatus] = useState<Status>('saved');
  const [invalidReason, setInvalidReason] = useState('');
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { token.current = data.session?.access_token ?? null; });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { token.current = s?.access_token ?? null; });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  // Rebuild the public page after saves (at most every 30 s, always when publishing).
  const revalidate = useCallback((force = false) => {
    const g = latest.current;
    if (!g.isPublic || g.isDraft) return;
    if (!force && Date.now() - lastRevalidate.current < 30_000) return;
    lastRevalidate.current = Date.now();
    fetch(`/api/guides/${encodeURIComponent(g.id)}/revalidate`, { method: 'POST' }).catch(() => {});
  }, []);

  const run = useCallback(async (): Promise<void> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (saving.current) { again.current = true; return; }
    if (!dirty.current) return;
    saving.current = true;
    dirty.current = false;
    setStatus('saving');
    const res = await saveGuide(supabase, latest.current, version.current);
    saving.current = false;
    if (res.status === 'ok') {
      version.current = res.version;
      revalidate();
      if (again.current || dirty.current) { again.current = false; dirty.current = true; return run(); }
      setStatus('saved');
      return;
    }
    // Not saved: the edits stay marked as unsaved; the next edit or "Try again" retries.
    dirty.current = true;
    again.current = false;
    if (res.status === 'conflict') { setConflict(res); setStatus('dirty'); return; }
    if (res.status === 'invalid') { setInvalidReason(res.reason); setStatus('invalid'); return; }
    setStatus(res.status === 'denied' ? 'denied' : 'error');
  }, [supabase, revalidate]);

  const update = useCallback((fn: (g: TravelGuide) => TravelGuide) => {
    const next = fn(latest.current);
    if (next === latest.current) return;
    latest.current = next;
    setGuide(next);
    dirty.current = true;
    setInvalidReason('');
    setStatus(s => (s === 'saving' ? s : 'dirty'));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void run(); }, 800);
  }, [run]);

  // Hidden tab: save normally (the page is still alive). Closing tab: a keepalive request.
  // Unsaved changes: the browser asks before leaving.
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'hidden' && dirty.current) void run(); };
    const onPageHide = () => {
      if (dirty.current && token.current) saveOnClose(supabaseUrl, supabaseKey, token.current, latest.current, version.current);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current || saving.current) { e.preventDefault(); e.returnValue = ''; }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [run, supabaseUrl, supabaseKey]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  function loadLatest() {
    if (!conflict) return;
    latest.current = conflict.latest;
    setGuide(conflict.latest);
    version.current = conflict.version;
    dirty.current = false;
    setConflict(null);
    setStatus('saved');
  }
  function keepMine() {
    if (!conflict) return;
    version.current = conflict.version; // overwrite exactly that newer version, nothing later
    setConflict(null);
    dirty.current = true;
    void run();
  }

  function publish() {
    const g = latest.current;
    if (!Core.isRemote(g.coverImage)) return setError(gd('coverPhotoError'));
    for (const s of g.customSections.filter(s => s.type === 'accommodation')) {
      const name = (s.accommodationName || s.title || '').trim();
      if (!name) return setError(gd('accomNameRequired'));
      const imgs = s.images.length ? s.images : s.accommodationImage ? [s.accommodationImage] : [];
      if (imgs.length === 0) return setError(gd('accomPhotoRequired', { name }));
    }
    setError('');
    update(x => ({ ...x, isCompleted: true, isDraft: false }));
    void run().then(() => { revalidate(true); setNotice(t('publishedNote')); });
  }

  async function onCover(file: File | undefined) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await uploadImage(supabase, file);
      update(g => ({ ...g, coverImage: url, coverImageOffset: 50 }));
    } catch {
      setError(gd('uploadFailedMsg'));
    } finally {
      setUploading(false);
    }
  }

  async function deleteGuide() {
    if (!window.confirm(gd('deleteGuideConfirm', { title: guide.title }))) return;
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    const { error: err } = await supabase.from('guides').delete().eq('id', guide.id);
    if (err) return setError(t('notSaved'));
    window.location.assign(`/${locale}/my-guides`);
  }

  function toggleTag(tag: GuideTag) {
    setError('');
    update(g => {
      const current = g.tags ?? [];
      if (current.includes(tag)) return { ...g, tags: current.filter(x => x !== tag) };
      if (current.length >= Core.LIMITS.tags) { setError(cg('maxTagsMsg', { max: Core.LIMITS.tags })); return g; }
      return { ...g, tags: [...current, tag] };
    });
  }

  function addDay() {
    if (latest.current.days.length >= Core.LIMITS.days) return setError(gd('invalid_tooManyDays'));
    update(g => Core.addDay(g, gd('dayN', { n: g.days.length + 1 })));
  }

  const updateDay = (day: TripDay) => update(g => ({ ...g, days: g.days.map(d => (d.id === day.id ? day : d)) }));
  const removeDay = (id: string) => { if (window.confirm(gd('removeDayMsg'))) update(g => Core.removeDay(g, id)); };

  // ─── Status line ──────────────────────────────────────────────────────────
  const statusText = {
    saved: t('saved'), dirty: t('unsaved'), saving: t('saving'), error: t('notSaved'), denied: t('denied'),
    invalid: invalidReason ? gd(`invalid_${invalidReason}`) : t('notSaved'),
  }[status];
  const statusColor = status === 'saved' ? 'text-faint' : status === 'error' || status === 'invalid' || status === 'denied' ? 'text-red-300' : 'text-muted';
  const live = guide.isCompleted && !guide.isDraft && guide.isPublic !== false;
  const order = Core.getOrder(guide);

  const input = 'w-full rounded-xl border border-border bg-s2 px-4 py-2.5 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-accent/60';
  const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-faint';
  const card = 'rounded-3xl border border-border bg-surface p-5 sm:p-6';

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <a href={`/${locale}/my-guides`} className="text-sm text-muted hover:text-ink">←</a>
          <p className="min-w-0 flex-1 truncate font-display font-semibold">{guide.title || guide.destination}</p>
          <span className={`hidden text-sm sm:block ${statusColor}`} role="status">{statusText}</span>
          {(status === 'error') && (
            <button type="button" onClick={() => { dirty.current = true; void run(); }} className="text-sm font-semibold text-accent">{t('retry')}</button>
          )}
          {live && (
            <a href={publicPath} target="_blank" rel="noopener" className="hidden rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-s2 sm:block">
              {gd('viewGuide')} ↗
            </a>
          )}
          {guide.isCompleted ? (
            <button type="button" onClick={() => update(g => ({ ...g, isCompleted: false }))} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-s2">
              {gd('returnToEditing')}
            </button>
          ) : (
            <button type="button" onClick={publish} className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent2">{t('publish')}</button>
          )}
        </div>
        <p className={`px-4 pb-2 text-center text-xs sm:hidden ${statusColor}`}>{statusText}</p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {error && <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="rounded-2xl border border-accent/30 bg-accent/10 px-5 py-3 text-sm">{notice}</p>}

          <section className={card}>
            <label className={label} htmlFor="ed-title">{cg('guideTitleLabel')}</label>
            <input id="ed-title" className={`${input} font-display text-2xl font-bold`} value={guide.title} maxLength={Core.LIMITS.title}
              onChange={e => update(g => ({ ...g, title: e.target.value }))} />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className={label} htmlFor="ed-dest">{cg('destinationLabel').replace(' *', '')}</label>
                <input id="ed-dest" className={input} value={guide.destination} maxLength={Core.LIMITS.destination}
                  onChange={e => update(g => ({ ...g, destination: e.target.value }))} />
              </div>
              <div>
                <label className={label} htmlFor="ed-country">{cg('countryLabel')}</label>
                <input id="ed-country" className={input} list="ed-countries" value={guide.country} maxLength={Core.LIMITS.country}
                  onChange={e => update(g => ({ ...g, country: e.target.value }))} autoComplete="off" />
                <datalist id="ed-countries">{Core.COUNTRIES.map(c => <option key={c.name} value={c.name} />)}</datalist>
              </div>
              <div>
                <label className={label} htmlFor="ed-lang">{cg('languageLabel')}</label>
                <input id="ed-lang" className={input} list="ed-languages" value={guide.language ?? ''}
                  onChange={e => update(g => ({ ...g, language: e.target.value }))} autoComplete="off" />
                <datalist id="ed-languages">{Core.LANGUAGES.map(l => <option key={l.name} value={l.name} />)}</datalist>
              </div>
            </div>
            <textarea className={`${input} mt-4 min-h-[120px] leading-relaxed`} value={guide.description} maxLength={Core.LIMITS.description}
              placeholder={gd('introPlaceholder', { destination: guide.destination || '…' })}
              onChange={e => update(g => ({ ...g, description: e.target.value }))} />
          </section>

          <TipsEditor tips={guide.generalTips ?? []} onChange={tips => update(g => ({ ...g, generalTips: tips }))} card={card} input={input} />

          {order.map((entry, idx) => {
            const arrows = (
              <Arrows up={idx > 0} down={idx < order.length - 1} onMove={dir => update(g => Core.moveBlock(g, idx, dir))}
                labels={{ up: t('moveUp'), down: t('moveDown') }} />
            );
            if (entry.kind === 'day') {
              const index = guide.days.findIndex(d => d.id === entry.id);
              const day = guide.days[index];
              if (!day) return null;
              return (
                <DayEditor key={day.id} day={day} index={index} arrows={arrows} card={card} input={input}
                  onChange={updateDay} onRemove={() => removeDay(day.id)} />
              );
            }
            const section = guide.customSections.find(s => s.id === entry.id);
            return section ? <SectionStub key={section.id} section={section} arrows={arrows} card={card} /> : null;
          })}

          <button type="button" onClick={addDay}
            className="w-full rounded-3xl border border-dashed border-border px-5 py-4 text-sm font-semibold text-muted transition-colors hover:border-accent/50 hover:text-ink">
            + {gd('addDay')}
          </button>

          {(guide.placesToVisit ?? []).length > 0 && (
            <section className={card}>
              <h2 className="font-display text-xl font-bold">{gd('placesToVisit')}</h2>
              <ul className="mt-3 space-y-1 text-sm text-muted">{guide.placesToVisit.map(p => <li key={p.id}>• {p.name}</li>)}</ul>
              <p className="mt-3 text-xs text-faint">{t('sectionInApp')}</p>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <section className={card}>
            <span className={label}>{t('cover')}</span>
            {guide.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={renderUrl(guide.coverImage, 700)} alt="" className="aspect-[3/2] w-full rounded-2xl object-cover" />
            ) : (
              <div className="flex aspect-[3/2] w-full items-center justify-center rounded-2xl bg-[#1A1A2E] font-display text-5xl font-bold text-white/70">
                {(guide.destination || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <label className={`mt-3 block cursor-pointer rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold hover:bg-s2 ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
              {uploading ? t('uploading') : guide.coverImage ? t('changeCover') : t('uploadCover')}
              <input type="file" accept="image/*" className="hidden" onChange={e => { void onCover(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </section>

          <section className={card}>
            <span className={label}>{cg('visibilityLabel')}</span>
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map(pub => (
                <button key={String(pub)} type="button" aria-pressed={guide.isPublic === pub}
                  onClick={() => update(g => pub
                    ? (g.isPublic ? g : { ...g, isPublic: true, accessCode: '' })
                    : (g.isPublic === false ? g : { ...g, isPublic: false, accessCode: Core.generateCode(randomBytes) }))}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${guide.isPublic === pub ? 'border-accent bg-accent/10' : 'border-border hover:bg-s2'}`}>
                  {pub ? `🌍 ${common('public')}` : `🔒 ${common('private')}`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-faint">{guide.isPublic ? cg('publicSub') : cg('privateSub')}</p>
            {guide.isPublic === false && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border px-4 py-2.5">
                <span className="text-xs text-faint">{t('code')}</span>
                <span className="font-mono tracking-[0.3em]">{showCode ? guide.accessCode : '••••'}</span>
                <button type="button" onClick={() => setShowCode(v => !v)} className="text-xs font-semibold text-accent">{showCode ? t('hide') : t('show')}</button>
              </div>
            )}
          </section>

          <section className={card}>
            <span className={label}>{cg('tripTypeLabel')}</span>
            <div className="flex flex-wrap gap-2">
              {Core.ALL_TAGS.map(tag => {
                const on = (guide.tags ?? []).includes(tag);
                return (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={on}
                    className={`rounded-full border px-3 py-1.5 text-xs ${on ? 'border-accent bg-accent/15 text-ink' : 'border-border text-muted hover:text-ink'}`}>
                    {Core.TAG_META[tag].icon} {tagT.has(tag) ? tagT(tag) : Core.TAG_META[tag].label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-faint">{(guide.tags ?? []).length}/{Core.LIMITS.tags}</p>
          </section>

          <section className={card}>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={!!guide.commentsDisabled} className="h-4 w-4 accent-[#FF5C38]"
                onChange={e => update(g => ({ ...g, commentsDisabled: e.target.checked }))} />
              <span className="text-sm">{cg('disableComments')}</span>
            </label>
          </section>

          <button type="button" onClick={deleteGuide}
            className="w-full rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10">
            {gd('deleteGuide')}
          </button>
        </aside>
      </main>

      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">{gd('conflictTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{gd('conflictMsg')}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={loadLatest} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-s2">{gd('conflictReload')}</button>
              <button type="button" onClick={keepMine} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent2">{gd('conflictKeepMine')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Arrows({ up, down, onMove, labels }: { up: boolean; down: boolean; onMove: (dir: 1 | -1) => void; labels: { up: string; down: string } }) {
  const btn = 'flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-ink disabled:opacity-30';
  return (
    <div className="flex gap-1">
      <button type="button" className={btn} disabled={!up} onClick={() => onMove(-1)} aria-label={labels.up}>↑</button>
      <button type="button" className={btn} disabled={!down} onClick={() => onMove(1)} aria-label={labels.down}>↓</button>
    </div>
  );
}

function TipsEditor({ tips, onChange, card, input }: { tips: string[]; onChange: (tips: string[]) => void; card: string; input: string }) {
  const gd = useTranslations('app.guideDetail');
  const t = useTranslations('editor');
  const [draft, setDraft] = useState('');
  const add = () => { const v = draft.trim(); if (v) { onChange([...tips, v]); setDraft(''); } };
  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{gd('generalTips')}</h2>
        {tips.length > 0 && (
          <button type="button" className="text-xs text-faint hover:text-ink" onClick={() => { if (window.confirm(gd('removeAllTips'))) onChange([]); }}>
            {gd('clearTips')}
          </button>
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-center gap-2">
            <input className={input} value={tip} onChange={e => onChange(tips.map((x, j) => (j === i ? e.target.value : x)))}
              onBlur={e => { if (!e.target.value.trim()) onChange(tips.filter((_, j) => j !== i)); }} />
            <Arrows up={i > 0} down={i < tips.length - 1} onMove={dir => onChange(Core.moveItem(tips, i, dir))} labels={{ up: t('moveUp'), down: t('moveDown') }} />
            <button type="button" aria-label={t('remove')} onClick={() => onChange(tips.filter((_, j) => j !== i))} className="px-2 text-faint hover:text-ink">✕</button>
          </li>
        ))}
      </ul>
      <input className={`${input} mt-3`} value={draft} placeholder={gd('addTip')} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} onBlur={add} />
    </section>
  );
}

function DayEditor({ day, index, arrows, card, input, onChange, onRemove }: {
  day: TripDay; index: number; arrows: React.ReactNode; card: string; input: string;
  onChange: (d: TripDay) => void; onRemove: () => void;
}) {
  const gd = useTranslations('app.guideDetail');
  const t = useTranslations('editor');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const setStops = (stops: Stop[]) => onChange({ ...day, stops });
  const addStop = () => {
    const n = name.trim();
    if (!n) return; // a stop needs a name (app: GuideDetailScreen 515–522)
    setStops([...day.stops, { id: Core.uid(), name: n, notes: '', address: address.trim(), images: [] }]);
    setName('');
    setAddress('');
  };
  const color = ['#FF5C38', '#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F43F5E'][index % 8];

  return (
    <section className={card}>
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
        <input className={`${input} font-display text-lg font-bold`} value={day.label}
          onChange={e => onChange({ ...day, label: e.target.value })}
          onBlur={e => { if (!e.target.value.trim()) onChange({ ...day, label: gd('dayN', { n: index + 1 }) }); }} />
        {arrows}
        <button type="button" onClick={onRemove} className="px-2 text-sm text-faint hover:text-red-300" aria-label={gd('removeDay')}>✕</button>
      </div>

      {day.stops.length >= 2 && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="accent-[#FF5C38]" checked={day.showRoute !== false} onChange={e => onChange({ ...day, showRoute: e.target.checked })} />
          {gd('showRouteOnMap')}
        </label>
      )}

      <ol className="mt-4 space-y-3">
        {day.stops.map((s, i) => (
          <li key={s.id} className="rounded-2xl border border-border bg-bg/40 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: color }}>{i + 1}</span>
              <input className={input} value={s.name} placeholder={t('stopName')}
                onChange={e => setStops(day.stops.map(x => (x.id === s.id ? { ...x, name: e.target.value } : x)))} />
              <Arrows up={i > 0} down={i < day.stops.length - 1} onMove={dir => setStops(Core.moveItem(day.stops, i, dir))} labels={{ up: t('moveUp'), down: t('moveDown') }} />
              <button type="button" aria-label={t('remove')} onClick={() => setStops(day.stops.filter(x => x.id !== s.id))} className="px-2 text-faint hover:text-ink">✕</button>
            </div>
            <input className={`${input} mt-2 text-sm`} value={s.address} placeholder={gd('addAddressOptional')}
              onChange={e => setStops(day.stops.map(x => (x.id === s.id ? { ...x, address: e.target.value } : x)))} />
            <textarea className={`${input} mt-2 min-h-[70px] text-sm`} value={s.notes} placeholder={gd('addNotes')}
              onChange={e => setStops(day.stops.map(x => (x.id === s.id ? { ...x, notes: e.target.value } : x)))} />
          </li>
        ))}
      </ol>
      {day.stops.length === 0 && <p className="mt-3 text-sm text-faint">{gd('noStopsYet')}</p>}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className={input} value={name} placeholder={gd('addPlaceName')} onChange={e => setName(e.target.value)} data-role="new-stop-name"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStop(); } }} />
        <input className={input} value={address} placeholder={gd('addAddressOptional')} onChange={e => setAddress(e.target.value)} data-role="new-stop-address"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStop(); } }} />
        <button type="button" onClick={addStop} className="rounded-xl bg-accent/15 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-accent/25">+ {t('addStop')}</button>
      </div>
    </section>
  );
}

function SectionStub({ section, arrows, card }: { section: CustomSection; arrows: React.ReactNode; card: string }) {
  const gd = useTranslations('app.guideDetail');
  const t = useTranslations('editor');
  const typeKey = { list: 'sectionTypeList', checklist: 'sectionTypeList', note: 'sectionTypeNote', gallery: 'sectionTypeGallery', map: 'sectionTypeMap', accommodation: 'sectionTypeAccommodation' }[section.type] ?? 'sectionTypeList';
  return (
    <section className={`${card} opacity-80`}>
      <div className="flex items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold">{section.accommodationName || section.title || gd(typeKey)}</h2>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-faint">{gd(typeKey)}</span>
        {arrows}
      </div>
      <p className="mt-2 text-xs text-faint">{t('sectionInApp')}</p>
    </section>
  );
}
