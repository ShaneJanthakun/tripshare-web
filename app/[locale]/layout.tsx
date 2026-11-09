import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import { routing } from '../i18n/routing';
import { SITE_URL, APP_STORE_URL, OG_IMAGE } from '../seo';
import '../globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

// Title, description, canonical and hreflang are set per page (localizedMetadata in seo.ts),
// so a page that forgets them never inherits the home page's canonical.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

// Prerender every locale at build time. Static pages get their metadata in <head>
// (dynamic pages stream it into <body>) and are served straight from the CDN.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'TripShare',
      legalName: 'Janthakun Tech',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    {
      '@type': 'MobileApplication',
      name: 'TripShare – Trip Planner',
      operatingSystem: 'iOS, iPadOS, macOS',
      applicationCategory: 'TravelApplication',
      description:
        'Create day-by-day travel guides with real stops, maps and photos — and discover trips shared by people who have actually been there.',
      url: SITE_URL,
      downloadUrl: APP_STORE_URL,
      installUrl: APP_STORE_URL,
      image: `${SITE_URL}${OG_IMAGE.url}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: '#0F0D0C',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="bg-bg text-ink antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
