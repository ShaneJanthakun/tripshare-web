import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

const nextConfig: NextConfig = {
  // Never stream metadata into <body>: every user agent gets title, canonical and og:* in <head>.
  // Matters for dynamic pages (e.g. /g/<id> link previews) — plan F1.5 safety net.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fovddldyfhspgejjkvtd.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
