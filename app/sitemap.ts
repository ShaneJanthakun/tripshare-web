import type { MetadataRoute } from 'next';
import { routing } from './i18n/routing';
import { PAGES, url, languageAlternates } from './seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      lastModified,
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : path === '/features' ? 0.8 : 0.4,
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
