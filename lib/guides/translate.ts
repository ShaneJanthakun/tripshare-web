import type { TravelGuide } from '../core/guide';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase/env';

// Translating a guide on the website (plan F6.2), through the same Edge Function as the app
// (translate-guide v2: public guides only, cached per guide version, 20 new per user per day).
// applyTranslation is the app's (src/lib/guideTranslate.ts): text only; names, addresses and the
// map stay in the original, and missing pieces fall back to the original.

export interface FunctionTranslation {
  title: string;
  description: string;
  generalTips: string[];
  days: { label: string; stops: { notes: string }[] }[];
  places: { notes: string }[];
  sections: { title: string; note: string; items: string[]; checklist: string[] }[];
}

export type TranslateResult =
  | { ok: true; translation: FunctionTranslation }
  | { ok: false; reason: 'limit' | 'failed' };

export async function fetchTranslation(accessToken: string, guideId: string, lang: string): Promise<TranslateResult> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/translate-guide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideId, lang }),
      cache: 'no-store',
    });
    if (res.status === 429) return { ok: false, reason: 'limit' };
    const j = await res.json().catch(() => null);
    return res.ok && j?.translation ? { ok: true, translation: j.translation } : { ok: false, reason: 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export function applyTranslation(guide: TravelGuide, tr: FunctionTranslation): TravelGuide {
  return {
    ...guide,
    title: tr.title || guide.title,
    description: tr.description || guide.description,
    generalTips: (guide.generalTips ?? []).map((tip, i) => tr.generalTips?.[i] || tip),
    days: guide.days.map((d, di) => ({
      ...d,
      label: tr.days?.[di]?.label || d.label,
      stops: d.stops.map((s, si) => ({ ...s, notes: tr.days?.[di]?.stops?.[si]?.notes || s.notes })),
    })),
    placesToVisit: (guide.placesToVisit ?? []).map((p, i) => ({ ...p, notes: tr.places?.[i]?.notes || p.notes })),
    customSections: (guide.customSections ?? []).map((c, ci) => ({
      ...c,
      title: tr.sections?.[ci]?.title || c.title,
      note: tr.sections?.[ci]?.note || c.note,
      items: (c.items ?? []).map((item, i) => tr.sections?.[ci]?.items?.[i] || item),
      checklistItems: (c.checklistItems ?? []).map((ci2, i) => ({ ...ci2, text: tr.sections?.[ci]?.checklist?.[i] || ci2.text })),
    })),
  };
}
