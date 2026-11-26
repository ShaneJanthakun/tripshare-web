import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../Nav';
import Footer from '../../Footer';
import ProfileEditor, { type OwnProfile } from '../../../../components/social/ProfileEditor';
import { createClient } from '../../../../lib/supabase/server';

// Your own profile (plan F5.5–F5.7). Signed-in only ((app) layout); read with your session.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.profile' });
  return { title: `${t('editProfile')} | TripShare` };
}

type Row = { name: string | null; bio: string | null; photo_url: string | null; name_changes: number | null; preferred_tags: string[] | null; preferred_countries: string[] | null; blocked_users: string[] | null };

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const me = user!.id;
  const [{ data }, { count }] = await Promise.all([
    supabase.from('user_profiles').select('name, bio, photo_url, name_changes, preferred_tags, preferred_countries, blocked_users').eq('id', me).maybeSingle(),
    supabase.from('guides').select('id', { count: 'exact', head: true }).eq('author_id', me).eq('is_public', true).eq('is_draft', false),
  ]);
  const row = (data ?? {}) as Row;
  const blockedIds = row.blocked_users ?? [];
  const { data: names } = blockedIds.length
    ? await supabase.from('user_profiles').select('id, name').in('id', blockedIds.slice(0, 200))
    : { data: [] as { id: string; name: string }[] };
  const nameOf = new Map(((names ?? []) as { id: string; name: string }[]).map(n => [n.id, n.name]));

  const initial: OwnProfile = {
    id: me,
    name: (row.name ?? '').trim(),
    bio: row.bio ?? '',
    photoUrl: row.photo_url?.startsWith('https://') ? row.photo_url : '',
    nameChanges: row.name_changes ?? 0,
    tags: row.preferred_tags ?? [],
    countries: row.preferred_countries ?? [],
    blocked: blockedIds.map(id => ({ id, name: nameOf.get(id) ?? '' })),
    hasPublicGuide: (count ?? 0) > 0,
  };

  const all = (await getMessages({ locale })) as Record<string, any>;
  const messages = { nav: all.nav, social: all.social, app: { profile: all.app.profile, common: all.app.common, auth: all.app.auth, tags: all.app.tags } };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="profile" />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ProfileEditor locale={locale} initial={initial} />
      </NextIntlClientProvider>
      <Footer />
    </div>
  );
}
