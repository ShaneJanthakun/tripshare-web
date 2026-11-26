import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../Nav';
import Footer from '../../Footer';
import NotificationList from '../../../../components/social/NotificationList';
import { createClient } from '../../../../lib/supabase/server';
import { loadNotifications } from '../../../../lib/notifications';
import { loadPublicGuides } from '../../../../lib/guides/queries';
import { hasProfile } from '../../../../lib/profiles';

// Notifications (plan M8). Signed-in only ((app) layout); read with your session.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notifications' });
  return { title: `${t('title')} | TripShare` };
}

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const [items, guides, t] = await Promise.all([
    loadNotifications(supabase),
    loadPublicGuides().catch(() => []),
    getTranslations({ locale, namespace: 'notifications' }),
  ]);
  // Followers who have a public profile get a link (B9: real users with a public guide).
  const profiles = [...new Set(guides.filter(hasProfile).map(p => p.authorId))];
  const all = (await getMessages({ locale })) as Record<string, any>;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="notifications" />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-28 sm:px-6">
        <h1 className="font-display text-4xl font-bold tracking-tight">{t('title')}</h1>
        <NextIntlClientProvider locale={locale} messages={{ nav: all.nav, notifications: all.notifications }}>
          <NotificationList locale={locale} items={items ?? []} profiles={profiles} />
        </NextIntlClientProvider>
      </main>
      <Footer />
    </div>
  );
}
