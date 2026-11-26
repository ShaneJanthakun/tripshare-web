'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '../../lib/supabase/client';
import { ALL_TAGS, TAG_META, COUNTRIES } from '../../lib/core/guide';
import { setBlocked } from '../../lib/social';
import { uploadAvatar } from '../../lib/images/avatar';
import { renderUrl } from '../../lib/images';

// Your own profile on the web (plan F5.5–F5.7), as the app's profile and settings: photo, name
// (max 40 characters, at most 2 changes), bio, interests for "For you" (which the app only asks
// at onboarding), blocked users, sign out and delete account. Each field is saved on its own.

export type OwnProfile = {
  id: string; name: string; bio: string; photoUrl: string; nameChanges: number;
  tags: string[]; countries: string[]; blocked: { id: string; name: string }[]; hasPublicGuide: boolean;
};

const NAME_MAX = 40;

export default function ProfileEditor({ locale, initial }: { locale: string; initial: OwnProfile }) {
  const p = useTranslations('app.profile');
  const common = useTranslations('app.common');
  const auth = useTranslations('app.auth');
  const tagT = useTranslations('app.tags');
  const s = useTranslations('social');
  const sb = useRef(createClient()).current;
  const me = initial.id;

  const [photo, setPhoto] = useState(initial.photoUrl);
  const [name, setName] = useState(initial.name);
  const [savedName, setSavedName] = useState(initial.name);
  const [changes, setChanges] = useState(initial.nameChanges);
  const [editingName, setEditingName] = useState(false);
  const [bio, setBio] = useState(initial.bio);
  const [savedBio, setSavedBio] = useState(initial.bio);
  const [tags, setTags] = useState(initial.tags);
  const [countries, setCountries] = useState(initial.countries);
  const [country, setCountry] = useState('');
  const [blocked, setBlockedList] = useState(initial.blocked);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const left = Math.max(0, 2 - changes);

  const flash = (msg: string) => { setNote(msg); setError(''); setTimeout(() => setNote(n => (n === msg ? '' : n)), 2500); };
  const fail = () => { setError(auth('errorGeneric')); setNote(''); };
  const save = async (fields: Record<string, unknown>) => {
    const { error: e } = await sb.from('user_profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', me);
    if (e) { fail(); return false; }
    flash(s('saved'));
    return true;
  };

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setBusy('photo');
    try {
      const url = await uploadAvatar(sb, file);
      if (await save({ photo_url: url })) setPhoto(url);
    } catch { fail(); }
    setBusy('');
  }

  async function saveName() {
    const v = name.trim().slice(0, NAME_MAX);
    setEditingName(false);
    if (!v || v === savedName) { setName(savedName); return; }
    // The limit is checked against the database, not just this page (the app counts too).
    const { data } = await sb.from('user_profiles').select('name_changes').eq('id', me).maybeSingle();
    const now = (data as { name_changes?: number } | null)?.name_changes ?? changes;
    if (now >= 2) { setChanges(now); setName(savedName); return; }
    if (await save({ name: v, name_changes: now + 1 })) { setSavedName(v); setName(v); setChanges(now + 1); }
    else setName(savedName);
  }

  async function saveBio() {
    const v = bio.trim();
    if (v === savedBio) return;
    if (await save({ bio: v })) setSavedBio(v);
  }

  async function savePrefs(nextTags: string[], nextCountries: string[]) {
    setTags(nextTags);
    setCountries(nextCountries);
    await save({ preferred_tags: nextTags, preferred_countries: nextCountries });
  }

  async function unblock(id: string) {
    if (await setBlocked(sb, me, id, false)) { setBlockedList(b => b.filter(x => x.id !== id)); flash(s('saved')); }
    else fail();
  }

  async function signOut() {
    await sb.auth.signOut({ scope: 'local' });
    window.location.assign(`/${locale}`);
  }

  async function deleteAccount() {
    if (!window.confirm(`${p('deleteTitle')}\n\n${p('deleteConfirm')}`)) return;
    setBusy('delete');
    const { error: e } = await sb.rpc('delete_my_account');
    if (e) { setBusy(''); fail(); return; }
    await sb.auth.signOut({ scope: 'local' });
    window.location.assign(`/${locale}`);
  }

  const card = 'rounded-3xl border border-border bg-surface p-6';
  const label = 'mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-faint';
  const input = 'w-full rounded-xl border border-border bg-s2 px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-faint focus:border-accent/60';
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-xs transition-colors ${on ? 'border-accent bg-accent/15 text-ink' : 'border-border text-muted hover:text-ink'}`;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">{p('editProfile')}</h1>
      <div className="mt-4 min-h-[1.5rem] text-sm" aria-live="polite">
        {note && <span className="text-faint">{note}</span>}
        {error && <span role="alert" className="text-red-300">{error}</span>}
      </div>

      <section className={`${card} mt-2 flex flex-col items-center gap-6 sm:flex-row sm:items-start`}>
        <label className={`group relative shrink-0 cursor-pointer ${busy === 'photo' ? 'pointer-events-none opacity-60' : ''}`}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={renderUrl(photo, 240, 240)} alt="" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center rounded-full bg-accent font-display text-5xl font-bold text-white">{(savedName || '?').charAt(0).toUpperCase()}</span>
          )}
          <span className="absolute inset-x-0 -bottom-2 mx-auto w-fit rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
            {busy === 'photo' ? common('loading') : s('changePhoto')}
          </span>
          <input type="file" accept="image/*" className="sr-only" onChange={e => { void onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <div className="w-full min-w-0 flex-1 space-y-5">
          <div>
            <span className={label}>{p('displayName')}</span>
            {editingName ? (
              <input className={input} value={name} maxLength={NAME_MAX} autoFocus onChange={e => setName(e.target.value)}
                onBlur={saveName} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setName(savedName); setEditingName(false); } }} />
            ) : (
              <div className="flex items-center gap-3">
                <p className="font-display text-2xl font-bold">{savedName}</p>
                {left > 0 && <button type="button" onClick={() => setEditingName(true)} className="text-sm font-semibold text-accent">{p('editName')}</button>}
              </div>
            )}
            <p className="mt-1 text-xs text-faint">{left > 0 ? p('nameChangesLeft', { count: left }) : p('nameLocked')}</p>
          </div>
          <div>
            <label className={label} htmlFor="bio">{p('bio')}</label>
            <textarea id="bio" className={`${input} min-h-[90px]`} value={bio} maxLength={500} placeholder={p('bioPlaceholderEdit')}
              onChange={e => setBio(e.target.value)} onBlur={saveBio} />
          </div>
          {initial.hasPublicGuide && (
            <a href={`/${locale}/u/${encodeURIComponent(me)}`} className="inline-block text-sm font-semibold text-accent hover:underline">{s('viewPublicProfile')} ↗</a>
          )}
        </div>
      </section>

      <section className={`${card} mt-6`}>
        <h2 className="font-display text-xl font-bold">{s('interests')}</h2>
        <p className="mt-1 text-sm text-muted">{s('interestsHint')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ALL_TAGS.map(tag => {
            const on = tags.includes(tag);
            return (
              <button key={tag} type="button" aria-pressed={on} className={chip(on)}
                onClick={() => void savePrefs(on ? tags.filter(t => t !== tag) : [...tags, tag], countries)}>
                {TAG_META[tag].icon} {tagT.has(tag) ? tagT(tag) : TAG_META[tag].label}
              </button>
            );
          })}
        </div>
        <p className={`${label} mt-6`}>{s('countries')}</p>
        <div className="flex flex-wrap gap-2">
          {countries.map(c => (
            <button key={c} type="button" className={chip(true)} onClick={() => void savePrefs(tags, countries.filter(x => x !== c))} aria-label={`${s('remove')} ${c}`}>
              {c} ✕
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input className={input} list="profile-countries" value={country} placeholder={s('addCountry')} onChange={e => setCountry(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = country.trim(); if (v && !countries.includes(v)) void savePrefs(tags, [...countries, v]); setCountry(''); } }} />
          <datalist id="profile-countries">{COUNTRIES.map(c => <option key={c.name} value={c.name} />)}</datalist>
          <button type="button" className="shrink-0 rounded-xl bg-accent/15 px-4 text-sm font-semibold hover:bg-accent/25"
            onClick={() => { const v = country.trim(); if (v && !countries.includes(v)) void savePrefs(tags, [...countries, v]); setCountry(''); }}>
            {s('add')}
          </button>
        </div>
      </section>

      <section className={`${card} mt-6`}>
        <h2 className="font-display text-xl font-bold">{p('blockedUsers')}</h2>
        {blocked.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{p('noBlocked')}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {blocked.map(b => (
              <li key={b.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5">
                <span className="text-sm">{b.name || '—'}</span>
                <button type="button" onClick={() => void unblock(b.id)} className="text-sm font-semibold text-accent">{p('unblock')}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} mt-6 flex flex-wrap gap-3`}>
        <button type="button" onClick={signOut} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-s2">{p('signOut')}</button>
        <button type="button" onClick={deleteAccount} disabled={busy === 'delete'}
          className="rounded-xl border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60">
          {busy === 'delete' ? common('loading') : p('deleteAccount')}
        </button>
      </section>
    </main>
  );
}
