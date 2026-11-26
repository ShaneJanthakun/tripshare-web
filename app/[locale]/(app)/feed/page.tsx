import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../Nav';
import Footer from '../../Footer';
import Feed from '../../../../components/feed/Feed';
import { createClient } from '../../../../lib/supabase/server';
import { loadFeedPage, type FeedProfile } from '../../../../lib/guides/feed';

// The personal feed (plan F4.3): the first page is read on the server with the user's session,
// the rest (more pages, search, people) in the browser. Signed-in only ((app) layout).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.home' });
  return { title: `${t('discoverGuides')} | TripShare` };
}

export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data }, first] = await Promise.all([
    supabase.from('user_profiles').select('following, blocked_users, preferred_tags, preferred_countries').eq('id', user!.id).maybeSingle(),
    loadFeedPage(supabase, 0),
  ]);
  const row = (data ?? {}) as { following?: string[]; blocked_users?: string[]; preferred_tags?: string[]; preferred_countries?: string[] };
  const profile: FeedProfile = {
    following: row.following ?? [],
    blocked: row.blocked_users ?? [],
    prefTags: row.preferred_tags ?? [],
    prefCountries: row.preferred_countries ?? [],
  };

  // Only the texts the feed needs go to the browser.
  const all = (await getMessages({ locale })) as Record<string, any>;
  const messages = {
    nav: all.nav,
    share: all.share,
    feed: all.feed,
    myGuides: all.myGuides,
    guide: { like: all.guide.like, unlike: all.guide.unlike, likeSignIn: all.guide.likeSignIn },
    app: { home: all.app.home, common: all.app.common, tags: all.app.tags },
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="feed" />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Feed locale={locale} me={user!.id} profile={profile} initial={first} />
      </NextIntlClientProvider>
      <Footer />
    </div>
  );
}
