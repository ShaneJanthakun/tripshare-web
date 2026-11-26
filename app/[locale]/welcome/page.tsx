import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../Nav';
import NameForm from '../../../components/auth/NameForm';
import { createClient } from '../../../lib/supabase/server';

// Name prompt for new web users without a name (plan F2.3). Outside (app) to avoid a loop.
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function WelcomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const next = `/${locale}/my-guides`;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await supabase.from('user_profiles').select('id').eq('id', user.id).maybeSingle();
  if (profile) redirect(next);
  const [t, ta] = await Promise.all([
    getTranslations({ locale, namespace: 'welcome' }),
    getTranslations({ locale, namespace: 'app.auth' }),
  ]);
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16 pt-28">
        <h1 className="text-center font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mb-8 mt-3 text-center text-muted">{t('intro')}</p>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <NameForm next={next} labels={{ placeholder: ta('namePlaceholder'), continue: t('continue'), errorName: ta('errorName'), errorGeneric: ta('errorGeneric') }} />
        </div>
      </main>
    </div>
  );
}
