import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../../Nav';
import Footer from '../../../Footer';
import { GuideHeader, GuideBody } from '../../../../../components/guide/GuideView';
import GuideMap from '../../../../../components/guide/GuideMap';
import Comments from '../../../../../components/social/Comments';
import { createClient } from '../../../../../lib/supabase/server';
import { migrate } from '../../../../../lib/core/guide';
import { buildGuideMap, buildMiniMap, type GuideMapData } from '../../../../../lib/guides/mapdata';
import { guideLocale, guidePath, type PublicGuide } from '../../../../../lib/guides/model';
import { commentLabels } from '../../../../../components/social/commentLabels';

// A private guide on the web (plan F6.6): signed in, with the access code, through the same
// database function as the app (get_guide_with_code). The owner needs no code; public guides go
// to their normal page. Never indexed ((app) layout). Wrong codes are limited by M5d.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.publicProfile' });
  return { title: `${t('privateGuideTitle')} | TripShare` };
}

type Result = { data: unknown; upvotes: number | null; views: number | null } | null;

export default async function PrivateGuidePage({ params, searchParams }: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const code = ((await searchParams).code ?? '').trim().toUpperCase().slice(0, 12);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // With a code: the database function (wrong codes are counted, M5d). Without: only what you
  // may read anyway (your own guide), so opening the form never uses up an attempt.
  let res: Result = null;
  if (code) {
    const { data: row, error } = await supabase.rpc('get_guide_with_code', { p_guide_id: id, p_code: code });
    res = (error ? null : row) as Result;
  } else {
    const { data: own } = await supabase.from('guides').select('data, upvotes, views').eq('id', id).eq('author_id', user!.id).maybeSingle();
    res = (own ?? null) as Result;
  }
  const t = await getTranslations({ locale });

  if (!res?.data || typeof res.data !== 'object') {
    // Unknown guide or wrong/missing code: the same form (doesn't tell which, so ids can't be probed).
    return (
      <div className="flex min-h-screen flex-col bg-bg text-ink">
        <Nav />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-28">
          <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
            <p className="text-3xl" aria-hidden>🔒</p>
            <h1 className="mt-3 font-display text-2xl font-bold">{t('app.publicProfile.privateGuideTitle')}</h1>
            <p className="mt-2 text-muted">{t('app.publicProfile.privateGuideMessage')}</p>
            {code && (
              <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {t('app.publicProfile.incorrectCodeMessage')}
              </p>
            )}
            <form method="get" className="mt-6 flex gap-2">
              <label className="sr-only" htmlFor="code">{t('share.codeLabel')}</label>
              <input id="code" name="code" autoComplete="off" autoCapitalize="characters" maxLength={12} required autoFocus
                placeholder={t('share.codeLabel')} defaultValue={code}
                className="min-w-0 flex-1 rounded-xl border border-border bg-s2 px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.3em] text-ink outline-none placeholder:font-sans placeholder:text-sm placeholder:normal-case placeholder:tracking-normal placeholder:text-faint focus:border-accent/60" />
              <button type="submit" className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent2">{t('share.openWithCode')}</button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const guide = { ...migrate(res.data), id };
  if (guide.isPublic !== false && guide.isCompleted && !guide.isDraft) redirect(guidePath(guideLocale(guide), guide));
  if (!user) notFound();

  const p: PublicGuide = {
    guide,
    authorId: guide.authorId,
    upvotes: res.upvotes ?? 0,
    views: res.views ?? 0,
    updatedAt: new Date().toISOString(),
    createdAt: guide.createdAt ?? new Date().toISOString(),
  };
  const [map, minis] = await Promise.all([
    buildGuideMap(guide),
    Promise.all((guide.customSections ?? []).filter(s => s.type === 'map').map(async s => {
      const mini = await buildMiniMap(s.items ?? [], guide);
      return [s.id, { ...mini, lines: [], groups: [], missing: 0 }] as [string, GuideMapData];
    })),
  ]);
  const mapLabels = { all: t('guide.mapAll'), empty: t('app.guideDetail.addStopsToMap'), error: t('guide.mapError') };
  const subtitle = [guide.destination, guide.country].map(s => s?.trim()).filter(Boolean).join(', ');

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <div className="print:hidden"><Nav /></div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 print:pt-0">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/40 px-3 py-1 text-xs font-semibold text-[#C4B5FD] print:hidden">
          🔒 {t('app.publicProfile.privateCode')}
        </p>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <GuideHeader p={p} locale={locale} subtitle={subtitle} />
          </div>
          <aside className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 print:hidden" aria-label={t('app.guideDetail.map')}>
            <div className="lg:sticky lg:top-24">
              <GuideMap data={map} labels={mapLabels} />
            </div>
          </aside>
          <div className="lg:col-span-7">
            <GuideBody p={p} locale={locale} miniMaps={Object.fromEntries(minis)} />
            {!guide.commentsDisabled && (
              <div className="print:hidden"><Comments guideId={guide.id} ownerId={p.authorId} locale={locale} labels={commentLabels(t)} /></div>
            )}
          </div>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
