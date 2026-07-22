import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../i18n/routing';
import '../globals.css';

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
    <html lang={locale}>
      <body className="bg-bg text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
