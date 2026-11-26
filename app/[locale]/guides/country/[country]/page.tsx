import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import LandingPage from '../../../../../components/guide/LandingPage';
import { loadPublicGuides } from '../../../../../lib/guides/queries';
import { landingCountries, guidesInCountry, countryLabel, MIN_LANDING } from '../../../../../lib/guides/discover';
import { pageMetadata } from '../../../../seo';

// Travel guides for one destination country (plan F4.2), e.g. /no/guides/country/italy.
// Static (ISR 10 min). Only countries with at least 2 guides have a page; others give 404.
export const revalidate = 600;
export const dynamicParams = true;

type Params = { locale: string; country: string };

export async function generateStaticParams() {
  const out = landingCountries(await loadPublicGuides()).map(c => ({ country: c.slug }));
  return out.length ? out : [{ country: '_' }]; // Next 15.5: an empty list drops prerendering (see guide page)
}

async function load(slug: string) {
  const all = await loadPublicGuides();
  const list = guidesInCountry(all, slug);
  return list.length >= MIN_LANDING ? { all, list, name: list[0].guide.country.trim() } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, country } = await params;
  const data = await load(country);
  if (!data) return { robots: { index: false, follow: false } };
  const t = await getTranslations({ locale, namespace: 'meta.guidesCountry' });
  const label = countryLabel(data.name, locale);
  return pageMetadata({
    locale,
    path: `/guides/country/${country}`,
    title: t('title', { country: label }),
    description: t('description', { country: label, count: data.list.length }),
  });
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { locale, country } = await params;
  setRequestLocale(locale);
  const data = await load(country);
  if (!data) notFound();
  const t = await getTranslations({ locale, namespace: 'guidesPage' });
  const label = countryLabel(data.name, locale);
  return (
    <LandingPage
      locale={locale}
      all={data.all}
      list={data.list}
      heading={t('countryHeading', { country: label })}
      intro={t('countryIntro', { country: label, count: data.list.length })}
      current={`country/${country}`}
      path={`/guides/country/${country}`}
    />
  );
}
