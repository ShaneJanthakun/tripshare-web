import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../Nav';
import Footer from '../Footer';
import LoginForm from '../../../components/auth/LoginForm';
import { safeNext } from '../../../lib/auth/paths';
import { webPageLink } from '../../../lib/auth/links';

// Sign in or create an account, with the same account as in the app (plan F2.1). Not indexed.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'login' });
  return { title: `${t('title')} | TripShare`, robots: { index: false, follow: false } };
}

const AUTH_KEYS = [
  'logIn', 'createAccount', 'namePlaceholder', 'emailPlaceholder', 'passwordPlaceholder', 'continueWithApple', 'continueWithGoogle',
  'noAccount', 'signUp', 'haveAccount', 'emailConfirmation', 'errorEmail', 'errorPassword', 'errorName', 'errorPasswordLength',
  'errorGeneric', 'errorApple', 'errorGoogle', 'errorInvalidCredentials', 'errorUserExists', 'errorWeakPassword',
  'errorEmailInvalid', 'errorRateLimit', 'errorNetwork',
] as const;

export default async function LoginPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; error?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next, error } = await searchParams;
  const [t, ta, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'login' }),
    getTranslations({ locale, namespace: 'app.auth' }),
    getTranslations({ locale, namespace: 'app.common' }),
  ]);
  const labels = {
    ...Object.fromEntries(AUTH_KEYS.map(k => [k, ta(k)])),
    or: tc('or'),
    sameMethodHint: t('sameMethodHint'),
    errorProvider: t('errorProvider'),
    forgotPassword: t('forgotPassword'),
  } as Parameters<typeof LoginForm>[0]['labels'];

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16 pt-28">
        <h1 className="text-center font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mb-8 mt-3 text-center text-muted">{t('intro')}</p>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <LoginForm next={safeNext(next, locale)} initialError={error} labels={labels} forgotHref={`/${locale}/reset-password`} />
        </div>
        <p className="mt-6 text-center text-xs text-faint">
          <a href={webPageLink(locale, 'terms')} className="hover:text-muted">{ta('terms')}</a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
