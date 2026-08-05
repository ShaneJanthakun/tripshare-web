import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import { routing } from '../i18n/routing';
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

export const metadata: Metadata = {
  title: 'TripShare – Share Your Journey',
  description: 'Create beautiful travel guides, discover trips from real travelers, and share your adventures with the world.',
  metadataBase: new URL('https://tripshare.online'),
  openGraph: {
    title: 'TripShare – Share Your Journey',
    description: 'Create beautiful travel guides and discover trips from real travelers.',
    url: 'https://tripshare.online',
    siteName: 'TripShare',
    type: 'website',
  },
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

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="bg-bg text-ink antialiased font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
