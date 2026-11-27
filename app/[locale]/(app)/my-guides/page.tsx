import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Nav from '../../Nav';
import Footer from '../../Footer';
import { Link } from '../../../i18n/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { loadOwnGuides, type OwnGuide } from '../../../../lib/guides/own';
import { renderUrl } from '../../../../lib/images';
import { guideLocale, guidePath } from '../../../../lib/guides/model';

// "My guides" (plan F2.7): every guide the signed-in user has written, with status.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'myGuides' });
  return { title: `${t('title')} | TripShare` };
}

function status(g: OwnGuide['guide']): 'statusDraft' | 'statusPrivate' | 'statusPublished' | 'statusInProgress' {
  if (g.isDraft) return 'statusDraft';
  if (g.isPublic === false) return 'statusPrivate';
  return g.isCompleted ? 'statusPublished' : 'statusInProgress';
}
const STATUS_STYLE = {
  statusDraft: 'border-border text-muted',
  statusPrivate: 'border-[#8B5CF6]/40 text-[#C4B5FD]',
  statusPublished: 'border-[#22C55E]/40 text-[#86EFAC]',
  statusInProgress: 'border-accent/40 text-accent',
};

export default async function MyGuidesPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ created?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { created } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [t, te, { data: profile }, guides] = await Promise.all([
    getTranslations({ locale, namespace: 'myGuides' }),
    getTranslations({ locale, namespace: 'editor' }),
    supabase.from('user_profiles').select('name').eq('id', user!.id).maybeSingle(),
    loadOwnGuides(supabase, user!.id),
  ]);
  const date = new Intl.DateTimeFormat(locale === 'no' ? 'nb' : locale, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Nav active="myGuides" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-28 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">{t('title')}</h1>
            {profile?.name && <p className="mt-2 text-sm text-faint">{t('signedInAs', { name: profile.name })}</p>}
          </div>
          <Link href="/my-guides/new" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent2">
            + {t('newGuide')}
          </Link>
        </header>

        {created && (
          <p role="status" className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-ink">{t('created')}</p>
        )}

        {guides.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-border bg-surface p-10 text-center">
            <p className="text-muted">{t('empty')}</p>
            <Link href="/my-guides/new" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent2">
              {t('emptyCta')}
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map(({ guide: g, updatedAt, upvotes, views }) => {
                const s = status(g);
                const live = s === 'statusPublished' || s === 'statusInProgress';
                return (
                  <li key={g.id} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-surface">
                    {g.coverImage ? (
                      <Image src={renderUrl(g.coverImage, 400, 260)} alt="" width={400} height={260} unoptimized className="aspect-[3/2] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[3/2] w-full items-center justify-center bg-[#1A1A2E] font-display text-5xl font-bold text-white/70">
                        {(g.destination || g.title || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[s]}`}>{t(s)}</span>
                        {updatedAt && <span className="text-xs text-faint">{t('edited', { date: date.format(new Date(updatedAt)) })}</span>}
                      </div>
                      <h2 className="mt-3 font-display text-lg font-semibold leading-snug">{g.title}</h2>
                      <p className="mt-1 text-sm text-muted">{[g.destination, g.country].filter(Boolean).join(', ')}</p>
                      <p className="mt-2 text-xs text-faint">♥ {upvotes} · 👁 {views}</p>
                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <Link href={`/edit/${encodeURIComponent(g.id)}`} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent2">{te('edit')}</Link>
                        {live && (
                          <a href={guidePath(guideLocale(g), g)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-s2">{t('view')}</a>
                        )}
                        <a href={`tripshare://guide/${encodeURIComponent(g.id)}`} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-s2 lg:hidden">{t('openInApp')}</a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
