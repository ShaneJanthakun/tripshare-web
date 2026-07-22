import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'no', 'es', 'fr', 'pt', 'th'],
  defaultLocale: 'en',
});
