import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from './i18n/routing';

export const SITE_URL = 'https://tripshare.online';
export const APP_STORE_URL = 'https://apps.apple.com/app/id6778097653';
export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'TripShare – Travel guides by real travelers',
};

// Each page's path, and the key of its title/description under `meta` in messages/*.json.
export const PAGE_PATHS = {
  home: '',
  features: '/features',
  support: '/support',
  privacy: '/privacy',
  terms: '/terms',
} as const;
export type PageKey = keyof typeof PAGE_PATHS;
export const PAGES = Object.values(PAGE_PATHS);

// Open Graph wants language_TERRITORY. Portuguese copy is European (pt-PT).
const OG_LOCALES: Record<string, string> = {
  en: 'en_US', no: 'nb_NO', es: 'es_ES', fr: 'fr_FR', pt: 'pt_PT',
  th: 'th_TH', ja: 'ja_JP', zh: 'zh_CN', ko: 'ko_KR', de: 'de_DE',
};

/** Absolute URL for a page in a given locale, e.g. url('no', '/features'). */
export function url(locale: string, path: string = '') {
  return `${SITE_URL}/${locale}${path}`;
}

/** hreflang map for every locale + x-default. */
export function languageAlternates(path: string = '') {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = url(l, path);
  languages['x-default'] = url(routing.defaultLocale, path);
  return languages;
}

/** Per-page metadata: canonical, hreflang, Open Graph and Twitter card. */
export function pageMetadata({
  locale,
  path = '',
  title,
  description,
}: {
  locale: string;
  path?: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: url(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: url(locale, path),
      siteName: 'TripShare',
      type: 'website',
      locale: OG_LOCALES[locale] ?? locale,
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALES[l] ?? l),
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/** Metadata for one of the fixed pages, with title/description in the page's own language. */
export async function localizedMetadata(locale: string, page: PageKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `meta.${page}` });
  return pageMetadata({
    locale,
    path: PAGE_PATHS[page],
    title: t('title'),
    description: t('description'),
  });
}
