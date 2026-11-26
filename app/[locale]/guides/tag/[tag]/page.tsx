import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import LandingPage from '../../../../../components/guide/LandingPage';
import { loadPublicGuides } from '../../../../../lib/guides/queries';
import { landingTags, guidesWithTag, tagFromSlug, MIN_LANDING } from '../../../../../lib/guides/discover';
import { pageMetadata } from '../../../../seo';

// Travel guides for one travel type (plan F4.2), e.g. /no/guides/tag/foodie. Static (ISR 10 min).
// Only the app's 16 types, and only with at least 2 guides; others give 404.
export const revalidate = 600;
export const dynamicParams = true;

type Params = { locale: string; tag: string };

export async function generateStaticParams() {
  const out = landingTags(await loadPublicGuides()).map(t => ({ tag: t.slug }));
  return out.length ? out : [{ tag: '_' }]; // Next 15.5: an empty list drops prerendering (see guide page)
}

async function load(slug: string) {
  const tag = tagFromSlug(slug);
  if (!tag) return null;
  const all = await loadPublicGuides();
  const list = guidesWithTag(all, tag);
  return list.length >= MIN_LANDING ? { all, list, tag } : null;
}

async function tagLabel(locale: string, tag: string) {
  const t = await getTranslations({ locale, namespace: 'app.tags' });
  return t.has(tag) ? t(tag) : tag;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, tag } = await params;
  const data = await load(tag);
  if (!data) return { robots: { index: false, follow: false } };
  const t = await getTranslations({ locale, namespace: 'meta.guidesTag' });
  const label = await tagLabel(locale, data.tag);
  return pageMetadata({
    locale,
    path: `/guides/tag/${tag}`,
    title: t('title', { tag: label }),
    description: t('description', { tag: label, count: data.list.length }),
  });
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { locale, tag } = await params;
  setRequestLocale(locale);
  const data = await load(tag);
  if (!data) notFound();
  const t = await getTranslations({ locale, namespace: 'guidesPage' });
  const label = await tagLabel(locale, data.tag);
  return (
    <LandingPage
      locale={locale}
      all={data.all}
      list={data.list}
      heading={t('tagHeading', { tag: label })}
      intro={t('tagIntro', { tag: label, count: data.list.length })}
      current={`tag/${tag}`}
      path={`/guides/tag/${tag}`}
    />
  );
}
