'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '../../lib/supabase/client';
import { saveGuide, saveOnClose, type SaveResult } from '../../lib/guides/save';
import { uploadImage, imageFiles } from '../../lib/images/upload';
import { renderUrl } from '../../lib/images';
import type { GuideMapData } from '../../lib/guides/mapdata';
import * as Core from '../../lib/core/guide';
import type { TravelGuide, GuideTag } from '../../lib/core/guide';
import GuideMap from '../guide/GuideMap';
import { EditorContext, ui, type EditorApi, type PickedPlace } from './context';
import { Arrows } from './bits';
import DayEditor from './DayEditor';
import SectionEditor, { SectionPicker, PlacesEditor } from './SectionEditor';

// The web editor (plan 06, phase 3). Same behaviour as the app's GuideDetailScreen in edit mode,
// built on the shared core, so the app and the website write exactly the same guide format.
// Autosave 800 ms after the last change and when the tab is hidden; conflicts are detected
// with the row's version (data contract 4). Right column: the live map (same data as the
// public page), which also picks places on click.

type Status = 'saved' | 'dirty' | 'saving' | 'error' | 'invalid' | 'denied';
type Conflict = Extract<SaveResult, { status: 'conflict' }>;
const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const EMPTY_MAP: GuideMapData = { pins: [], lines: [], groups: [], center: null, missing: 0 };
const UPLOADS_AT_ONCE = 3;

type Props = {
  locale: string;
  initialGuide: TravelGuide;
  initialVersion: number;
  previewPath: string;
  supabaseUrl: string;
  supabaseKey: string;
  mapLabels: { all: string; empty: string; error: string };
};

export default function Editor({ locale, initialGuide, initialVersion, previewPath, supabaseUrl, supabaseKey, mapLabels }: Props) {
  const t = useTranslations('editor');
  const gd = useTranslations('app.guideDetail');
  const cg = useTranslations('app.createGuide');
  const common = useTranslations('app.common');
  const tagT = useTranslations('app.tags');
  const mapLang = locale === 'no' ? 'nb' : locale;

  const supabase = useRef(createClient()).current;
  const [guide, setGuide] = useState(initialGuide);
  const latest = useRef(initialGuide);
  const version = useRef(initialVersion);
  const dirty = useRef(false);
  const saving = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtySince = useRef(0); // first unsaved change: long bursts of edits still save every 5 s
  const token = useRef<string | null>(null);
  const lastRevalidate = useRef(0);
  const [status, setStatus] = useState<Status>('saved');
  const [invalidReason, setInvalidReason] = useState('');
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [coverBusy, setCoverBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [picker, setPicker] = useState(false);

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
    dirtySince.current = 0;
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
    if (!dirtySince.current) dirtySince.current = Date.now();
    const wait = Date.now() - dirtySince.current > 5000 ? 0 : 800;
    timer.current = setTimeout(() => { timer.current = null; void run(); }, wait);
  }, [run]);

  // ─── Photos: local preview at once, uploaded three at a time ──────────────
  const [uploads, setUploads] = useState(0);
  const uploading = useRef(0);
  const slots = useRef({ busy: 0, waiting: [] as Array<() => void> });
  const withSlot = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const s = slots.current;
    while (s.busy >= UPLOADS_AT_ONCE) await new Promise<void>(r => s.waiting.push(r));
    s.busy++;
    try { return await fn(); } finally { s.busy--; s.waiting.shift()?.(); }
  }, []);

  const addImages = useCallback<EditorApi['addImages']>((files, apply) => {
    if (!files.length) return;
    const previews = files.map(f => URL.createObjectURL(f));
    update(g => apply(g, previews));
    files.forEach((file, i) => {
      const local = previews[i];
      uploading.current++;
      setUploads(n => n + 1);
      withSlot(() => uploadImage(supabase, file))
        .then(url => update(g => Core.replaceInGuide(g, local, url)))
        .catch(() => { update(g => Core.removeFromGuide(g, local)); setError(gd('uploadFailedMsg')); })
        .finally(() => {
          uploading.current--;
          setUploads(n => n - 1);
          setTimeout(() => URL.revokeObjectURL(local), 10_000);
        });
    });
  }, [update, withSlot, supabase, gd]);

  // Hidden tab: save normally (the page is still alive). Closing tab: a keepalive request.
  // Unsaved changes or photos still uploading: the browser asks before leaving.
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'hidden' && dirty.current) void run(); };
    const onPageHide = () => {
      if (dirty.current && token.current) saveOnClose(supabaseUrl, supabaseKey, token.current, latest.current, version.current);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current || saving.current || uploading.current > 0) { e.preventDefault(); e.returnValue = ''; }
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

  // ─── Map: suggestions near the destination, live map, picking places ──────
  const [near, setNear] = useState<string | undefined>();
  useEffect(() => {
    const dest = initialGuide.destination?.trim();
    if (!dest) return;
    const qs = new URLSearchParams({ q: dest, country: initialGuide.country ?? '', lang: mapLang });
    fetch(`/api/geocode?${qs}`).then(r => (r.ok ? r.json() : null)).then(j => { if (j) setNear(`${j.lat},${j.lng}`); }).catch(() => {});
  }, [initialGuide.destination, initialGuide.country, mapLang]);

  // Only what the map shows is sent; the server runs the same buildGuideMap as the public page.
  const mapInput = useMemo(() => JSON.stringify({
    id: guide.id,
    destination: guide.destination,
    country: guide.country,
    days: guide.days.map(d => ({ id: d.id, label: d.label, showRoute: d.showRoute, stops: d.stops.map(s => ({ id: s.id, name: s.name, address: s.address })) })),
    customSections: guide.customSections.filter(s => s.type === 'map' || s.type === 'accommodation').map(s => ({
      id: s.id, type: s.type, title: s.title, items: s.type === 'map' ? s.items : [],
      accommodationName: s.accommodationName, accommodationAddress: s.accommodationAddress,
      accommodationLat: s.accommodationLat, accommodationLng: s.accommodationLng,
    })),
  }), [guide.id, guide.destination, guide.country, guide.days, guide.customSections]);

  const [mapData, setMapData] = useState<GuideMapData>(EMPTY_MAP);
  const [mapBusy, setMapBusy] = useState(true);
  const firstMap = useRef(true);
  useEffect(() => {
    const ctrl = new AbortController();
    const go = setTimeout(() => {
      setMapBusy(true);
      fetch('/api/editor-map', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mapInput, signal: ctrl.signal })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: GuideMapData) => { setMapData(d); setMapBusy(false); })
        .catch(e => { if ((e as Error).name !== 'AbortError') setMapBusy(false); });
    }, firstMap.current ? 0 : 1200);
    firstMap.current = false;
    return () => { clearTimeout(go); ctrl.abort(); };
  }, [mapInput]);

  const [mapOpen, setMapOpen] = useState(false); // phones: the map folds away
  const mapBox = useRef<HTMLDivElement>(null);
  const pickCb = useRef<{ fn: (p: PickedPlace) => void; allowNoAddress: boolean } | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickBusy, setPickBusy] = useState(false);

  const startPick = useCallback<EditorApi['startPick']>((fn, allowNoAddress = false) => {
    pickCb.current = { fn, allowNoAddress };
    setPicking(true);
    setMapOpen(true);
    setError('');
    setTimeout(() => mapBox.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }, []);
  const cancelPick = () => { pickCb.current = null; setPicking(false); };

  const onMapPick = useCallback(async (lat: number, lng: number) => {
    const cb = pickCb.current;
    if (!cb) return;
    pickCb.current = null;
    setPicking(false);
    setPickBusy(true);
    let address = '';
    try {
      const res = await fetch(`/api/reverse?${new URLSearchParams({ lat: String(lat), lng: String(lng), lang: mapLang })}`);
      if (res.ok) address = (await res.json()).address ?? '';
    } catch { /* offline: treated as no address */ }
    setPickBusy(false);
    if (!address && !cb.allowNoAddress) { setError(t('noAddressHere')); return; }
    cb.fn({ lat, lng, address });
  }, [mapLang, t]);

  useEffect(() => {
    if (!picking) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelPick(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picking]);

  const api = useMemo<EditorApi>(() => ({
    locale,
    mapLang,
    near,
    update,
    updateDay: (id, fn) => update(g => ({ ...g, days: g.days.map(d => (d.id === id ? fn(d) : d)) })),
    updateSection: (id, fn) => update(g => ({ ...g, customSections: g.customSections.map(s => (s.id === id ? fn(s) : s)) })),
    addImages,
    startPick,
    setError,
  }), [locale, mapLang, near, update, addImages, startPick]);

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
    if (uploading.current > 0) return setError(gd('leaveUploadingTitle'));
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
    setCoverBusy(true);
    try {
      const url = await uploadImage(supabase, file);
      update(g => ({ ...g, coverImage: url, coverImageOffset: 50 }));
    } catch {
      setError(gd('uploadFailedMsg'));
    } finally {
      setCoverBusy(false);
    }
  }

  // "See the guide": the preview always shows the latest save, so save first. The tab is
  // opened at once (popup blockers) and pointed at the preview when the save is done.
  function openPreview(e: React.MouseEvent) {
    if (!dirty.current && !saving.current) return;
    e.preventDefault();
    const tab = window.open('about:blank', '_blank');
    void run().then(() => { if (tab) tab.location.href = previewPath; });
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

  function addDay(title = '') {
    if (latest.current.days.length >= Core.LIMITS.days) return setError(gd('invalid_tooManyDays'));
    update(g => Core.addDay(g, title || gd('dayN', { n: g.days.length + 1 })));
  }

  const removeDay = (id: string) => { if (window.confirm(gd('removeDayMsg'))) update(g => Core.removeDay(g, id)); };
  const removeSection = (id: string) => {
    if (window.confirm(`${gd('removeSectionTitle')}\n\n${gd('removeSectionMsg')}`)) update(g => Core.removeCustomSection(g, id));
  };

  // ─── Status line ──────────────────────────────────────────────────────────
  const statusText = uploads > 0 && status !== 'error' ? t('uploading') : {
    saved: t('saved'), dirty: t('unsaved'), saving: t('saving'), error: t('notSaved'), denied: t('denied'),
    invalid: invalidReason ? gd(`invalid_${invalidReason}`) : t('notSaved'),
  }[status];
  const statusColor = status === 'saved' && uploads === 0 ? 'text-faint' : status === 'error' || status === 'invalid' || status === 'denied' ? 'text-red-300' : 'text-muted';
  const live = guide.isCompleted && !guide.isDraft && guide.isPublic !== false;
  const order = Core.getOrder(guide);
  const { input, label, card } = ui;

  return (
    <EditorContext.Provider value={api}>
      <div className="min-h-screen bg-bg text-ink">
        <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
            <a href={`/${locale}/my-guides`} className="text-sm text-muted hover:text-ink" aria-label={common('back')}>←</a>
            <p className="min-w-0 flex-1 truncate font-display font-semibold">{guide.title || guide.destination}</p>
            <span className={`hidden text-sm sm:block ${statusColor}`} role="status">{statusText}</span>
            {status === 'error' && (
              <button type="button" onClick={() => { dirty.current = true; void run(); }} className="text-sm font-semibold text-accent">{t('retry')}</button>
            )}
            <a href={previewPath} target="_blank" rel="noopener" onClick={openPreview} aria-label={gd('viewGuide')}
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-s2 sm:px-4">
              <span className="sm:hidden" aria-hidden>👁</span>
              <span className="hidden sm:inline">{gd('viewGuide')} ↗</span>
            </a>
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

        <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12">
          {/* Map: right column on PC (sticky); on phones it folds open above the content. */}
          <aside className="lg:sticky lg:top-24 lg:order-2 lg:col-span-5 lg:self-start" aria-label={gd('map')}>
            <button type="button" onClick={() => setMapOpen(o => !o)} aria-expanded={mapOpen}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm font-semibold hover:bg-s2 lg:hidden">
              🗺 {mapOpen ? t('hideMap') : t('showMap')}
            </button>
            <div ref={mapBox} className={`${mapOpen ? 'mt-3' : 'hidden'} lg:mt-0 lg:block`}>
              {(picking || pickBusy) && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
                  <span className="flex-1">{pickBusy ? common('loading') : t('pickHint')}</span>
                  {picking && <button type="button" onClick={cancelPick} className="font-semibold text-accent">{common('cancel')}</button>}
                </div>
              )}
              <GuideMap data={mapData} labels={mapLabels} alwaysShow picking={picking} onPick={onMapPick} />
              <p className="mt-2 min-h-[1.25rem] text-xs text-faint" aria-live="polite">
                {mapBusy ? gd('loadingMap') : mapData.missing > 0 ? t('missingOnMap', { count: mapData.missing }) : ''}
              </p>
            </div>
          </aside>

          <div className="space-y-8 lg:order-1 lg:col-span-7">
            {error && <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-300">{error}</p>}
            {notice && <p role="status" className="rounded-2xl border border-accent/30 bg-accent/10 px-5 py-3 text-sm">{notice}</p>}

            <section className={`${card} overflow-hidden !p-0`}>
              <label
                className={`group relative block cursor-pointer ${coverBusy ? 'pointer-events-none' : ''}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); void onCover(imageFiles(e.dataTransfer.files)[0]); }}
              >
                {guide.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={renderUrl(guide.coverImage, 1100)} alt="" className="h-56 w-full object-cover sm:h-72"
                    style={{ objectPosition: `center ${guide.coverImageOffset ?? 50}%` }} />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center bg-[#1A1A2E] font-display text-6xl font-bold text-white/70 sm:h-72">
                    {(guide.destination || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-3 right-3 rounded-xl bg-black/65 px-4 py-2 text-sm font-semibold text-white backdrop-blur group-hover:bg-black/80">
                  {coverBusy ? t('uploading') : guide.coverImage ? t('changeCover') : t('uploadCover')}
                </span>
                <input type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={e => { void onCover(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <div className="p-5 sm:p-6">
                <label className={label} htmlFor="ed-title">{cg('guideTitleLabel')}</label>
                <input id="ed-title" className={`${input} font-display text-2xl font-bold`} value={guide.title} maxLength={Core.LIMITS.title}
                  onChange={e => { const v = e.target.value; update(g => ({ ...g, title: v })); }} />
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={label} htmlFor="ed-dest">{cg('destinationLabel').replace(' *', '')}</label>
                    <input id="ed-dest" className={input} value={guide.destination} maxLength={Core.LIMITS.destination}
                      onChange={e => { const v = e.target.value; update(g => ({ ...g, destination: v })); }} />
                  </div>
                  <div>
                    <label className={label} htmlFor="ed-country">{cg('countryLabel')}</label>
                    <input id="ed-country" className={input} list="ed-countries" value={guide.country} maxLength={Core.LIMITS.country}
                      onChange={e => { const v = e.target.value; update(g => ({ ...g, country: v })); }} autoComplete="off" />
                    <datalist id="ed-countries">{Core.COUNTRIES.map(c => <option key={c.name} value={c.name} />)}</datalist>
                  </div>
                  <div>
                    <label className={label} htmlFor="ed-lang">{cg('languageLabel')}</label>
                    <input id="ed-lang" className={input} list="ed-languages" value={guide.language ?? ''}
                      onChange={e => { const v = e.target.value; update(g => ({ ...g, language: v })); }} autoComplete="off" />
                    <datalist id="ed-languages">{Core.LANGUAGES.map(l => <option key={l.name} value={l.name} />)}</datalist>
                  </div>
                </div>
                <textarea className={`${input} mt-4 min-h-[120px] leading-relaxed`} value={guide.description} maxLength={Core.LIMITS.description}
                  placeholder={gd('introPlaceholder', { destination: guide.destination || '…' })}
                  onChange={e => { const v = e.target.value; update(g => ({ ...g, description: v })); }} />
              </div>
            </section>

            <section className={`${card} grid gap-6 sm:grid-cols-2`}>
              <div>
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
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-border px-4 py-2.5">
                    <span className="text-xs text-faint">{t('code')}</span>
                    <span className="font-mono tracking-[0.3em]">{showCode ? guide.accessCode : '••••'}</span>
                    <button type="button" onClick={() => setShowCode(v => !v)} className="text-xs font-semibold text-accent">{showCode ? t('hide') : t('show')}</button>
                  </div>
                )}
                <label className="mt-5 flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={!!guide.commentsDisabled} className="h-4 w-4 accent-[#FF5C38]"
                    onChange={e => { const v = e.target.checked; update(g => ({ ...g, commentsDisabled: v })); }} />
                  <span className="text-sm">{cg('disableComments')}</span>
                </label>
              </div>
              <div>
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
              </div>
            </section>

            <TipsEditor tips={guide.generalTips ?? []} onChange={tips => update(g => ({ ...g, generalTips: tips }))} />

            {order.map((entry, idx) => {
              const arrows = <Arrows up={idx > 0} down={idx < order.length - 1} onMove={dir => update(g => Core.moveBlock(g, idx, dir))} />;
              if (entry.kind === 'day') {
                const index = guide.days.findIndex(d => d.id === entry.id);
                const day = guide.days[index];
                return day ? <DayEditor key={day.id} day={day} index={index} arrows={arrows} onRemove={() => removeDay(day.id)} /> : null;
              }
              const section = guide.customSections.find(s => s.id === entry.id);
              return section ? <SectionEditor key={section.id} section={section} arrows={arrows} onRemove={() => removeSection(section.id)} /> : null;
            })}

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => addDay()}
                className="rounded-3xl border border-dashed border-border px-5 py-4 text-sm font-semibold text-muted transition-colors hover:border-accent/50 hover:text-ink">
                + {gd('addDay')}
              </button>
              <button type="button" onClick={() => setPicker(true)}
                className="rounded-3xl border border-dashed border-border px-5 py-4 text-sm font-semibold text-muted transition-colors hover:border-accent/50 hover:text-ink">
                + {gd('addSection')}
              </button>
            </div>

            {(guide.placesToVisit ?? []).length > 0 && (
              <PlacesEditor places={guide.placesToVisit} onChange={fn => update(g => ({ ...g, placesToVisit: fn(g.placesToVisit ?? []) }))} />
            )}

            <button type="button" onClick={deleteGuide}
              className="w-full rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10">
              {gd('deleteGuide')}
            </button>
          </div>
        </main>

        {picker && (
          <SectionPicker
            onClose={() => setPicker(false)}
            onAddDay={title => addDay(title)}
            onAddSection={(title, type) => update(g => Core.addCustomSection(g, Core.newCustomSection(title, type)))}
          />
        )}

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
    </EditorContext.Provider>
  );
}

function TipsEditor({ tips, onChange }: { tips: string[]; onChange: (tips: string[]) => void }) {
  const gd = useTranslations('app.guideDetail');
  const t = useTranslations('editor');
  const [draft, setDraft] = useState('');
  const add = () => { const v = draft.trim(); if (v) { onChange([...tips, v]); setDraft(''); } };
  return (
    <section className={ui.card}>
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
            <input className={ui.input} value={tip} onChange={e => onChange(tips.map((x, j) => (j === i ? e.target.value : x)))}
              onBlur={e => { if (!e.target.value.trim()) onChange(tips.filter((_, j) => j !== i)); }} />
            <Arrows up={i > 0} down={i < tips.length - 1} onMove={dir => onChange(Core.moveItem(tips, i, dir))} />
            <button type="button" aria-label={t('remove')} onClick={() => onChange(tips.filter((_, j) => j !== i))} className={ui.x}>✕</button>
          </li>
        ))}
      </ul>
      <input className={`${ui.input} mt-3`} value={draft} placeholder={gd('addTip')} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} onBlur={add} />
    </section>
  );
}
