import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../../Nav';
import Footer from '../../../Footer';
import { GuideHeader, GuideBody } from '../../../../../components/guide/GuideView';
import GuideMap from '../../../../../components/guide/GuideMap';
import { createClient } from '../../../../../lib/supabase/server';
import { loadPublicGuide } from '../../../../../lib/guides/queries';
import { buildGuideMap, buildMiniMap, type GuideMapData } from '../../../../../lib/guides/mapdata';
import { guideLocale, guidePath } from '../../../../../lib/guides/model';
import { langCode } from '../../../../../lib/core/guide';
import { fetchTranslation, applyTranslation } from '../../../../../lib/guides/translate';

// A public guide translated into the visitor's language (plan F6.2): signed in only (DeepL costs
// money; the function allows 20 new translations per user per day), never indexed ((app) layout).
// The text is translated; names, addresses and the map stay as the author wrote them.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.guideDetail' });
  return { title: `${t('translate')} | TripShare` };
}

export default async function TranslatePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const p = await loadPublicGuide(id);
  if (!p) notFound();
  const original = p.guide;
  const supabase = await createClient();
  await supabase.auth.getUser(); // refreshes the session if needed
  const token = (await supabase.auth.getSession()).data.session?.access_token ?? '';
  const result = await fetchTranslation(token, id, locale);
  const t = await getTranslations({ locale });
  const shown = result.ok ? applyTranslation(original, result.translation) : original;
  const tp = { ...p, guide: shown };
  const [map, minis] = await Promise.all([
    buildGuideMap(original),
    Promise.all((original.customSections ?? []).filter(s => s.type === 'map').map(async s => {
      const mini = await buildMiniMap(s.items ?? [], original);
      return [s.id, { ...mini, lines: [], groups: [], missing: 0 }] as [string, GuideMapData];
    })),
  ]);
  const mapLabels = { all: t('guide.mapAll'), empty: t('app.guideDetail.addStopsToMap'), error: t('guide.mapError') };
  const fromCode = langCode(original.language) ?? guideLocale(original);
  let fromName = original.language ?? '';
  try { fromName = new Intl.DisplayNames([locale === 'no' ? 'nb' : locale], { type: 'language' }).of(fromCode === 'no' ? 'nb' : fromCode) ?? fromName; } catch { /* keep the stored name */ }
  const originalHref = guidePath(guideLocale(original), original);
  const note = result.ok
    ? t('guide.translatedNote', { from: fromName })
    : ('reason' in result && result.reason === 'limit') ? t('guide.translateLimit') : t('app.guideDetail.translateFailed');
  const subtitle = [original.destination, original.country].map(s => s?.trim()).filter(Boolean).join(', ');

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <div className="print:hidden"><Nav /></div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 print:pt-0">
        <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3 text-sm print:hidden ${result.ok ? 'border-accent/40 bg-accent/10' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
          <p className="min-w-0 flex-1">
            {note}
          </p>
          <a href={originalHref} className="rounded-xl border border-border px-4 py-2 font-semibold text-ink hover:bg-s2">{t('app.guideDetail.showOriginal')}</a>
        </div>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <GuideHeader p={tp} locale={locale} subtitle={subtitle} />
          </div>
          <aside className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 print:hidden" aria-label={t('app.guideDetail.map')}>
            <div className="lg:sticky lg:top-24">
              <GuideMap data={map} labels={mapLabels} />
            </div>
          </aside>
          <div className="lg:col-span-7">
            <GuideBody p={tp} locale={locale} miniMaps={Object.fromEntries(minis)} />
          </div>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
