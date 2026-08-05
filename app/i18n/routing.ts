import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'no', 'es', 'fr', 'pt', 'th', 'ja', 'zh', 'ko', 'de'],
  defaultLocale: 'en',
});
