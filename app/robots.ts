import type { MetadataRoute } from 'next';
import { SITE_URL } from './seo';

// Signed-in pages and the login page are never indexed (plan F2.6).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/*/my-guides', '/*/feed', '/*/liked', '/*/profile', '/*/notifications', '/*/private/', '/*/edit/', '/*/login', '/*/welcome', '/*/reset-password', '/auth/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
