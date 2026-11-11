import type { Metadata } from 'next';
import Image from 'next/image';
import { headers } from 'next/headers';
import { APP_STORE_URL, OG_IMAGE } from '../../seo';
import { pickLocale, shareTranslator } from '../locale';

// Short link shared from the app: https://tripshare.online/g/<id>.
// With app v1.3+ installed, iOS opens the app directly (universal link) and this page isn't shown.
// Everyone else (no app, PC, in-app browsers) gets a preview with buttons to the app and App Store,
// and link previews (WhatsApp, iMessage, Slack) get the guide's title and cover.
// In phase 1 this route redirects to the full guide page instead (plan F1.6).
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://fovddldyfhspgejjkvtd.supabase.co';
// Publishable (public) key — the same one the app ships with. It can only read public, published guides.
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_gaU8HM4KiihRkbG3kqL7pw_7NdpdQ-f';

type ShareGuide = {
  id: string;
  title: string;
  destination: string;
  country: string;
  description: string;
  coverImage: string;
  authorName: string | null;
  days: number;
  stops: number;
};

async function loadPublicGuide(id: string): Promise<ShareGuide | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/guides?select=id,author_id,data` +
    `&id=eq.${encodeURIComponent(id)}&is_public=eq.true&is_draft=eq.false&limit=1`;
  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY }, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const d = row?.data;
    if (!d || typeof d !== 'object') return null;
    const days: any[] = Array.isArray(d.days) ? d.days : [];
    return {
      id: String(row.id),
      title: String(d.title ?? ''),
      destination: String(d.destination ?? ''),
      country: String(d.country ?? ''),
      description: String(d.description ?? ''),
      coverImage: typeof d.coverImage === 'string' && d.coverImage.startsWith('https://') ? d.coverImage : '',
      // Seed guides have fictional authors; how to show them on the web is decision B1 — leave them out here.
      authorName: String(row.author_id ?? '').startsWith('seed_') ? null : (d.authorName ? String(d.authorName) : null),
      days: days.length,
      stops: days.reduce((n, day) => n + (Array.isArray(day?.stops) ? day.stops.length : 0), 0),
    };
  } catch {
    return null;
  }
}

// Supabase storage images are resized via /render/image/ (plain /object/ URLs ignore size params).
function renderUrl(url: string, width: number, height: number): string {
  if (!url.includes('/storage/v1/object/')) return url;
  return url.replace('/storage/v1/object/', '/storage/v1/render/image/') + `?width=${width}&height=${height}&resize=cover&quality=80`;
}

function excerpt(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).trimEnd() + '…';
}

async function visitorLocale() {
  return pickLocale((await headers()).get('accept-language'));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [guide, locale] = await Promise.all([loadPublicGuide(id), visitorLocale()]);
  const t = await shareTranslator(locale);
  if (!guide) {
    return { title: `${t('privateTitle')} | TripShare`, robots: { index: false, follow: false } };
  }
  const where = [guide.destination, guide.country].filter(Boolean).join(', ');
  const title = guide.title.toLowerCase().includes(guide.destination.toLowerCase()) || !where
    ? guide.title
    : `${guide.title} – ${where}`;
  const description = excerpt(guide.description || t('fallbackDescription', { destination: where || guide.title }), 160);
  const image = guide.coverImage
    ? { url: renderUrl(guide.coverImage, 1200, 630), width: 1200, height: 630, alt: guide.title }
    : OG_IMAGE;
  return {
    title: `${title} | TripShare`,
    description,
    // Not indexed: the canonical, indexable guide page comes with phase 1.
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'TripShare',
      url: `/g/${encodeURIComponent(guide.id)}`,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

export default async function ShortLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [guide, locale] = await Promise.all([loadPublicGuide(id), visitorLocale()]);
  const t = await shareTranslator(locale);
  const appLink = `tripshare://guide/${encodeURIComponent(id)}`;

  const buttons = (
    <div className="mt-6 flex flex-col gap-3">
      <a href={appLink} className="rounded-xl bg-accent px-5 py-3.5 text-center font-semibold text-white transition-colors hover:bg-accent2">
        {t('openInApp')}
      </a>
      <a href={APP_STORE_URL} className="rounded-xl border border-border px-5 py-3.5 text-center font-semibold transition-colors hover:bg-s2">
        {t('getApp')}
      </a>
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <a href={`/${locale}`} className="mb-6 flex items-center justify-center gap-2">
          <Image src="/icon.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-display text-lg font-bold">TripShare</span>
        </a>

        {guide ? (
          <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
            {guide.coverImage ? (
              <Image
                src={renderUrl(guide.coverImage, 900, 600)}
                alt=""
                width={900}
                height={600}
                unoptimized
                priority
                className="aspect-[3/2] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[3/2] w-full items-center justify-center bg-gradient-to-br from-accent to-accent2 font-display text-7xl font-bold text-white">
                {(guide.destination || guide.title).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="p-6">
              <h1 className="font-display text-2xl font-bold leading-tight">{guide.title}</h1>
              {(guide.destination || guide.country) && (
                <p className="mt-1 text-muted">{[guide.destination, guide.country].filter(Boolean).join(', ')}</p>
              )}
              <p className="mt-3 text-sm text-faint">
                {[
                  guide.days > 0 ? t('days', { count: guide.days }) : null,
                  guide.stops > 0 ? t('stops', { count: guide.stops }) : null,
                  guide.authorName ? t('by', { name: guide.authorName }) : null,
                ].filter(Boolean).join(' · ')}
              </p>
              {guide.description && (
                <p className="mt-4 text-[15px] leading-relaxed text-ink/90">{excerpt(guide.description, 280)}</p>
              )}
              {buttons}
            </div>
          </article>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
            <h1 className="font-display text-xl font-bold">{t('privateTitle')}</h1>
            <p className="mt-3 text-muted">{t('privateMsg')}</p>
            {buttons}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-faint">{t('tagline')}</p>
      </div>
    </main>
  );
}
