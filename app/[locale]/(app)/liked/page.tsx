import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../Nav';
import Footer from '../../Footer';
import { Link } from '../../../i18n/navigation';
import GuideCard from '../../../../components/guide/GuideCard';
import { createClient } from '../../../../lib/supabase/server';
import { loadGuidesByIds } from '../../../../lib/guides/feed';

// "Liked guides" (plan F4.7): the guides in profile.upvoted_guides, in the list's order (newest
// last, as in the app). The list is the one the app keeps; likes on the web come with M2 (F4.6).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'liked' });
  return { title: `${t('title')} | TripShare` };
}

export default async function LikedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [t, { data }] = await Promise.all([
    getTranslations({ locale, namespace: 'liked' }),
    supabase.from('user_profiles').select('upvoted_guides').eq('id', user!.id).maybeSingle(),
  ]);
  const ids = ((data as { upvoted_guides?: string[] } | null)?.upvoted_guides ?? []).filter(Boolean);
  const guides = await loadGuidesByIds(supabase, ids);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="liked" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
        <p className="mt-4 text-lg text-muted">{t('intro')}</p>
        {guides.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((p, i) => <GuideCard key={p.guide.id} p={p} locale={locale} priority={i < 3} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-border bg-surface p-10 text-center">
            <p className="text-muted">{t('empty')}</p>
            <Link href="/feed" className="mt-6 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent2">{t('emptyCta')}</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
