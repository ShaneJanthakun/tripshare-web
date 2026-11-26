'use client';

import { useMemo, useState } from 'react';
import {
  ALL_TAGS, TAG_META, COUNTRIES, LANGUAGES, LIMITS, type GuideTag,
  createEmptyGuide, validateGuide, guideToRow, generateCode,
} from '../../lib/core/guide';
import { createClient } from '../../lib/supabase/client';

// "New guide", the same form as the app's CreateGuideScreen (plan F2.8 and 05 "Ny guide").
// The guide is built with the shared core (createEmptyGuide) and saved with insert, never upsert.
const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const MAX_TAGS = LIMITS.tags;

type Labels = Record<
  | 'destinationLabel' | 'destinationPlaceholder' | 'countryLabel' | 'selectCountry' | 'languageLabel' | 'selectLanguage'
  | 'guideTitleLabel' | 'titleExample' | 'tripTypeLabel' | 'visibilityLabel' | 'publicSub' | 'privateSub'
  | 'commentsLabel' | 'disableComments' | 'commentsOff' | 'commentsOn' | 'accessCodeLabel' | 'accessCodeHint'
  | 'errorDestination' | 'errorLanguage' | 'maxTagsMsg' | 'saveFailedMsg' | 'saveInvalidMsg' | 'create'
  | 'public' | 'private' | 'cancel' | 'creating' | 'tagsCount' | 'selectCountryTitle',
  string
>;

type Props = {
  locale: string;
  authorId: string;
  authorName: string;
  firstDayLabel: string;
  titleSuggestion: string; // "{dest} Guide" with {dest} still in it
  tagLabels: Record<string, string>;
  labels: Labels;
};

export default function NewGuideForm({ locale, authorId, authorName, firstDayLabel, titleSuggestion, tagLabels, labels }: Props) {
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<GuideTag[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const countryNames = useMemo(() => new Map(COUNTRIES.map(c => [c.name.toLowerCase(), c.name])), []);
  const languageNames = useMemo(() => new Map(LANGUAGES.map(l => [l.name.toLowerCase(), l.name])), []);

  function toggleTag(tag: GuideTag) {
    setError('');
    setTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag);
      if (prev.length >= MAX_TAGS) { setError(labels.maxTagsMsg.replace('{max}', String(MAX_TAGS))); return prev; }
      return [...prev, tag];
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return; // a double click must not create two guides
    setError('');
    if (!destination.trim()) return setError(labels.errorDestination);
    const lang = languageNames.get(language.trim().toLowerCase());
    if (!lang) return setError(labels.errorLanguage);
    const ctry = country.trim() ? countryNames.get(country.trim().toLowerCase()) : '';
    if (ctry === undefined) return setError(labels.selectCountryTitle);

    const guide = createEmptyGuide({
      authorId, authorName, destination, country: ctry, language: lang, title, tags, isPublic,
      commentsDisabled, accessCode, firstDayLabel, randomBytes,
    });
    if (validateGuide(guide)) return setError(labels.saveInvalidMsg);

    setSaving(true);
    const { error: err } = await createClient().from('guides').insert(guideToRow(guide, 'web'));
    if (err && err.code !== '23505') {
      setError(labels.saveFailedMsg);
      setSaving(false);
      return;
    }
    window.location.assign(`/${locale}/my-guides?created=1`);
  }

  const label = 'mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-faint';
  const input = 'w-full rounded-xl border border-border bg-s2 px-4 py-3 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-accent/60';

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      <div>
        <label className={label} htmlFor="destination">{labels.destinationLabel}</label>
        <input id="destination" className={input} value={destination} onChange={e => setDestination(e.target.value)}
          placeholder={labels.destinationPlaceholder} maxLength={LIMITS.destination} autoFocus />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="country">{labels.countryLabel}</label>
          <input id="country" className={input} list="ts-countries" value={country} onChange={e => setCountry(e.target.value)}
            placeholder={labels.selectCountry} autoComplete="off" />
          <datalist id="ts-countries">{COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag}</option>)}</datalist>
        </div>
        <div>
          <label className={label} htmlFor="language">{labels.languageLabel} *</label>
          <input id="language" className={input} list="ts-languages" value={language} onChange={e => setLanguage(e.target.value)}
            placeholder={labels.selectLanguage} autoComplete="off" />
          <datalist id="ts-languages">{LANGUAGES.map(l => <option key={l.name} value={l.name} />)}</datalist>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="title">{labels.guideTitleLabel}</label>
        <input id="title" className={input} value={title} onChange={e => setTitle(e.target.value)} maxLength={LIMITS.title}
          placeholder={destination.trim() ? titleSuggestion.replace('{dest}', destination.trim()) : labels.titleExample} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={label.replace('mb-2 ', '')}>{labels.tripTypeLabel}</span>
          <span className="text-xs text-faint">{labels.tagsCount.replace('{count}', String(tags.length)).replace('{max}', String(MAX_TAGS))}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map(tag => {
            const on = tags.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={on}
                className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${on ? 'border-accent bg-accent/15 text-ink' : 'border-border text-muted hover:text-ink'}`}>
                {TAG_META[tag].icon} {tagLabels[tag] ?? TAG_META[tag].label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className={label}>{labels.visibilityLabel}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {[true, false].map(pub => (
            <button key={String(pub)} type="button"
              onClick={() => { setIsPublic(pub); if (!pub) setAccessCode(c => c || generateCode(randomBytes)); }}
              aria-pressed={isPublic === pub}
              className={`rounded-2xl border p-4 text-left transition-colors ${isPublic === pub ? 'border-accent bg-accent/10' : 'border-border hover:bg-s2'}`}>
              <span className="block font-semibold">{pub ? `🌍 ${labels.public}` : `🔒 ${labels.private}`}</span>
              <span className="mt-1 block text-sm text-muted">{pub ? labels.publicSub : labels.privateSub}</span>
            </button>
          ))}
        </div>
        {!isPublic && (
          <div className="mt-4">
            <label className={label} htmlFor="code">{labels.accessCodeLabel}</label>
            <input id="code" className={`${input} max-w-[10rem] font-mono uppercase tracking-[0.3em]`} value={accessCode} maxLength={4}
              onChange={e => setAccessCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4))} />
            <p className="mt-2 text-xs text-faint">{labels.accessCodeHint}</p>
          </div>
        )}
      </div>

      <div>
        <span className={label}>{labels.commentsLabel}</span>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-4">
          <input type="checkbox" checked={commentsDisabled} onChange={e => setCommentsDisabled(e.target.checked)} className="h-4 w-4 accent-[#FF5C38]" />
          <span>
            <span className="block font-semibold">{labels.disableComments}</span>
            <span className="block text-sm text-muted">{commentsDisabled ? labels.commentsOff : labels.commentsOn}</span>
          </span>
        </label>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <a href={`/${locale}/my-guides`} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-s2">{labels.cancel}</a>
        <button type="submit" disabled={saving} className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent2 disabled:opacity-60">
          {saving ? labels.creating : labels.create}
        </button>
      </div>
    </form>
  );
}
