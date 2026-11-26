import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../../Nav';
import Footer from '../../../Footer';
import NewGuideForm from '../../../../../components/auth/NewGuideForm';
import { createClient } from '../../../../../lib/supabase/server';
import { ALL_TAGS } from '../../../../../lib/core/guide';

// "New guide" (plan F2.8). The author name is always the profile name, otherwise migrate()
// would turn the guide into a team guide (plan/11-fallgruver.md #7).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'newGuide' });
  return { title: `${t('title')} | TripShare` };
}

const CG_KEYS = [
  'destinationLabel', 'destinationPlaceholder', 'countryLabel', 'selectCountry', 'languageLabel', 'selectLanguage',
  'guideTitleLabel', 'titleExample', 'tripTypeLabel', 'visibilityLabel', 'publicSub', 'privateSub', 'commentsLabel',
  'disableComments', 'commentsOff', 'commentsOn', 'accessCodeLabel', 'accessCodeHint', 'errorDestination', 'errorLanguage',
  'saveFailedMsg', 'saveInvalidMsg', 'create', 'selectCountryTitle',
] as const;

export default async function NewGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('user_profiles').select('name').eq('id', user!.id).maybeSingle();
  const [t, cg, common, tags, gd] = await Promise.all([
    getTranslations({ locale, namespace: 'newGuide' }),
    getTranslations({ locale, namespace: 'app.createGuide' }),
    getTranslations({ locale, namespace: 'app.common' }),
    getTranslations({ locale, namespace: 'app.tags' }),
    getTranslations({ locale, namespace: 'app.guideDetail' }),
  ]);
  const labels = {
    ...Object.fromEntries(CG_KEYS.map(k => [k, cg(k)])),
    maxTagsMsg: cg.raw('maxTagsMsg') as string,
    public: common('public'), private: common('private'), cancel: common('cancel'),
    creating: t('creating'), tagsCount: t.raw('tagsCount') as string,
  } as Parameters<typeof NewGuideForm>[0]['labels'];
  const tagLabels = Object.fromEntries(ALL_TAGS.map(tag => [tag, tags.has(tag) ? tags(tag) : tag]));

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="myGuides" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-28 sm:px-6">
        <h1 className="mb-8 font-display text-4xl font-bold tracking-tight">{t('title')}</h1>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <NewGuideForm
            locale={locale}
            authorId={user!.id}
            authorName={profile?.name ?? ''}
            firstDayLabel={gd('dayN', { n: 1 })}
            titleSuggestion={cg.raw('titleSuggestion') as string}
            tagLabels={tagLabels}
            labels={labels}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
