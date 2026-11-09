import type { Metadata } from 'next';
import { routing } from './i18n/routing';

export const SITE_URL = 'https://tripshare.online';
export const APP_STORE_URL = 'https://apps.apple.com/app/id6778097653';
export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'TripShare – Travel guides by real travelers',
};

export const PAGES = ['', '/features', '/support', '/privacy', '/terms'] as const;

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
      locale,
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
