import type { MetadataRoute } from 'next';
import { routing } from './i18n/routing';
import { PAGES, SITE_URL, url, languageAlternates } from './seo';
import { loadPublicGuides } from '../lib/guides/queries';
import { guideLocale, guidePath, isThin } from '../lib/guides/model';

// Fixed pages in every language, plus each guide once at its canonical URL. Thin guides
// (noindex) stay out (12-seo.md § 3, rule 5). Rebuilt with the guides (10 minutes).
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const fixed = PAGES.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      lastModified,
      changeFrequency: path === '' || path === '/guides' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : path === '/guides' || path === '/features' ? 0.8 : 0.4,
      alternates: { languages: languageAlternates(path) },
    })),
  );
  const guides = await loadPublicGuides().catch(() => []);
  const guidePages = guides
    .filter((p) => !isThin(p.guide))
    .map((p) => ({
      url: SITE_URL + guidePath(guideLocale(p.guide), p.guide),
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  return [...fixed, ...guidePages];
}
