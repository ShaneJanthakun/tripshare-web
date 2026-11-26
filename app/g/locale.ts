import { createTranslator } from 'next-intl';
import { routing } from '../i18n/routing';

const SUPPORTED = routing.locales as readonly string[];

// Best match for the visitor among our 10 languages (Accept-Language), else the fallback (English).
// iOS and browsers report Norwegian as nb/nn; the site's Norwegian is "no".
export function pickLocale(acceptLanguage: string | null, fallback: string = routing.defaultLocale): string {
  if (!acceptLanguage) return fallback;
  const prefs = acceptLanguage
    .split(',')
    .map(part => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: q ? parseFloat(q) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of prefs) {
    const base = tag.split('-')[0];
    const code = base === 'nb' || base === 'nn' ? 'no' : base;
    if (SUPPORTED.includes(code)) return code;
  }
  return fallback;
}

// Short-link pages live outside [locale] (no next-intl middleware), so translate directly.
export async function shareTranslator(locale: string) {
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return createTranslator({ locale, messages, namespace: 'share' });
}
