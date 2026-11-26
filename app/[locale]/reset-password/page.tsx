import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../Nav';
import Footer from '../Footer';
import { Link } from '../../i18n/navigation';
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';
import { createClient } from '../../../lib/supabase/server';

// Forgotten password (plan F2.4). Dynamic and not indexed.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resetPassword' });
  return { title: `${t('title')} | TripShare`, robots: { index: false, follow: false } };
}

const AUTH_KEYS = ['emailPlaceholder', 'errorEmail', 'errorPasswordLength', 'errorGeneric', 'errorRateLimit', 'errorNetwork',
  'errorWeakPassword', 'errorInvalidCredentials', 'errorUserExists', 'errorEmailInvalid'] as const;

export default async function ResetPasswordPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ step?: string; error?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { step, error } = await searchParams;
  const [t, ta] = await Promise.all([
    getTranslations({ locale, namespace: 'resetPassword' }),
    getTranslations({ locale, namespace: 'app.auth' }),
  ]);
  let mode: 'request' | 'new' = 'request';
  let expired = error === 'expired';
  if (step === 'new') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) mode = 'new'; else expired = true;
  }
  const labels = {
    ...Object.fromEntries(AUTH_KEYS.map(k => [k, ta(k)])),
    sendLink: t('sendLink'), sent: t('sent'), newPasswordPlaceholder: t('newPasswordPlaceholder'),
    savePassword: t('savePassword'), saved: t('saved'),
  } as Parameters<typeof ResetPasswordForm>[0]['labels'];

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="login" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16 pt-28">
        <h1 className="text-center font-display text-3xl font-bold tracking-tight">{mode === 'new' ? t('newTitle') : t('title')}</h1>
        <p className="mb-8 mt-3 text-center text-muted">{mode === 'new' ? t('newIntro') : t('intro')}</p>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          {expired && <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{t('expired')}</p>}
          <ResetPasswordForm step={mode} locale={locale} labels={labels} />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted hover:text-ink">← {t('backToLogin')}</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
