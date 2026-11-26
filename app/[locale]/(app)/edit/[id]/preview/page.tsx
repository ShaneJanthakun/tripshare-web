import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../../../Nav';
import { GuideHeader, GuideBody } from '../../../../../../components/guide/GuideView';
import GuideMap from '../../../../../../components/guide/GuideMap';
import { createClient } from '../../../../../../lib/supabase/server';
import { migrate, ADMIN_USER_ID } from '../../../../../../lib/core/guide';
import { buildGuideMap, buildMiniMap, type GuideMapData } from '../../../../../../lib/guides/mapdata';
import { guideLocale, guidePath, type PublicGuide } from '../../../../../../lib/guides/model';

// "See the guide" from the editor (plan F3.3): the guide as readers will see it, from the latest
// save, also before it is published. Only the author or admin; never indexed ((app) layout).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'editor' });
  return { title: `${t('preview')} | TripShare` };
}

type Row = { id: string; data: unknown; author_id: string; upvotes: number | null; views: number | null; updated_at: string | null; created_at: string | null };

export default async function PreviewPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('guides').select('id, data, author_id, upvotes, views, updated_at, created_at').eq('id', id).maybeSingle();
  const row = data as Row | null;
  if (!row) notFound();
  const guide = { ...migrate(row.data), id: row.id };
  if (row.author_id !== user!.id && user!.id !== ADMIN_USER_ID) redirect(guidePath(guideLocale(guide), guide));

  const p: PublicGuide = {
    guide,
    authorId: row.author_id,
    upvotes: row.upvotes ?? 0,
    views: row.views ?? 0,
    updatedAt: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
    createdAt: row.created_at ?? new Date(0).toISOString(),
  };
  const t = await getTranslations({ locale });
  const [map, minis] = await Promise.all([
    buildGuideMap(guide),
    Promise.all((guide.customSections ?? []).filter(s => s.type === 'map').map(async s => {
      const mini = await buildMiniMap(s.items ?? [], guide);
      return [s.id, { ...mini, lines: [], groups: [], missing: 0 }] as [string, GuideMapData];
    })),
  ]);
  const mapLabels = { all: t('guide.mapAll'), empty: t('app.guideDetail.addStopsToMap'), error: t('guide.mapError') };
  const live = guide.isCompleted && !guide.isDraft && guide.isPublic !== false;
  const subtitle = [guide.destination, guide.country].map(s => s?.trim()).filter(Boolean).join(', ');

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-3 text-sm">
          <p className="min-w-0 flex-1">
            <strong className="font-semibold">{t('editor.preview')}.</strong>{' '}
            {live ? t('editor.previewNote') : t('editor.previewDraft')}
          </p>
          {live && (
            <a href={guidePath(guideLocale(guide), guide)} className="font-semibold text-accent hover:underline">{t('editor.openPublic')}</a>
          )}
          <a href={`/${locale}/edit/${encodeURIComponent(guide.id)}`} className="rounded-xl border border-border px-4 py-2 font-semibold hover:bg-s2">
            {t('editor.backToEditor')}
          </a>
        </div>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <GuideHeader p={p} locale={locale} subtitle={subtitle} />
          </div>
          <aside className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1" aria-label={t('app.guideDetail.map')}>
            <div className="lg:sticky lg:top-24">
              <GuideMap data={map} labels={mapLabels} />
            </div>
          </aside>
          <div className="lg:col-span-7">
            <GuideBody p={p} locale={locale} miniMaps={Object.fromEntries(minis)} />
          </div>
        </div>
      </main>
    </div>
  );
}
