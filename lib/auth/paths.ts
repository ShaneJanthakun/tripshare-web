import { routing } from '../../app/i18n/routing';

// Where a sign-in may send the user afterwards. Only internal paths ("/no/my-guides"), never
// "//evil.com" or "https://…" (plan F2.2).
export function safeNext(next: string | null | undefined, locale: string): string {
  const fallback = `/${locale}/my-guides`;
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}

/** The site language from a path like "/no/my-guides", else English. */
export function localeFromPath(path: string | null | undefined): string {
  const seg = (path ?? '').split('/')[1] ?? '';
  return (routing.locales as readonly string[]).includes(seg) ? seg : routing.defaultLocale;
}
