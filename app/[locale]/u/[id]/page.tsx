import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../Nav';
import Footer from '../../Footer';
import { Link } from '../../../i18n/navigation';
import GuideCard from '../../../../components/guide/GuideCard';
import ProfileActions from '../../../../components/social/ProfileActions';
import { loadPublicGuides } from '../../../../lib/guides/queries';
import { loadPublicProfile, hasProfile } from '../../../../lib/profiles';
import { renderUrl } from '../../../../lib/images';
import { url } from '../../../seo';

// Public profile (plan F5.2, B9 = yes): name, bio, photo, followers and the user's published
// public guides. Static (ISR 10 min). Only for real users with a public guide; others give 404.
// noindex, follow: people's names stay out of search results; the guides are linked and indexed.
export const revalidate = 600;
export const dynamicParams = true;

type Params = { locale: string; id: string };

export async function generateStaticParams() {
  const ids = [...new Set((await loadPublicGuides()).filter(hasProfile).map(p => p.authorId))];
  return ids.length ? ids.map(id => ({ id })) : [{ id: '_' }]; // Next 15.5: an empty list drops prerendering
}

async function load(id: string) {
  const profile = await loadPublicProfile(decodeURIComponent(id));
  if (!profile) return null;
  const guides = (await loadPublicGuides()).filter(p => p.authorId === profile.id && hasProfile(p));
  return guides.length ? { profile, guides } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, id } = await params;
  const data = await load(id);
  if (!data) return { robots: { index: false, follow: false } };
  const t = await getTranslations({ locale, namespace: 'social' });
  const title = `${data.profile.name} – TripShare`;
  const description = data.profile.bio || t('profileDescription', { name: data.profile.name, count: data.guides.length });
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: url(locale, `/u/${encodeURIComponent(data.profile.id)}`) },
    openGraph: { title, description, type: 'profile', siteName: 'TripShare' },
  };
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const data = await load(id);
  if (!data) notFound();
  const { profile, guides } = data;
  const t = await getTranslations({ locale });

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="guides" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6">
        <Link href="/guides" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
          <span aria-hidden>←</span> {t('guide.allGuides')}
        </Link>
        <header className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-8 text-center sm:flex-row sm:items-start sm:text-left">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={renderUrl(profile.photoUrl, 240, 240)} alt="" className="h-28 w-28 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-accent font-display text-5xl font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
            {profile.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-muted">{profile.bio}</p>}
            <ProfileActions
              userId={profile.id}
              name={profile.name}
              followers={profile.followers}
              locale={locale}
              labels={{
                followers: t('app.profile.followers'),
                follow: t('app.common.follow'),
                following: t('app.common.following'),
                signIn: t('app.publicProfile.signInFollow'),
                more: t('app.publicProfile.moreOptions'),
                report: t('app.publicProfile.reportUser'),
                block: t('app.guideDetail.block'),
                unblock: t('app.profile.unblock'),
                blockTitle: t.raw('app.guideDetail.blockUserTitle') as string,
                blockConfirm: t('app.publicProfile.blockConfirm'),
              }}
            />
          </div>
        </header>

        <h2 className="mt-12 font-display text-2xl font-bold">{t('app.common.guides')} <span className="text-faint">({guides.length})</span></h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((p, i) => <GuideCard key={p.guide.id} p={p} locale={locale} priority={i < 3} />)}
        </div>
      </main>
      <Footer />
    </div>
  );
}
