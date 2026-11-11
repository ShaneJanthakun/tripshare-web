import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import { SITE_URL } from '../seo';
import { pickLocale } from './locale';
import '../globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] });

export const metadata: Metadata = { metadataBase: new URL(SITE_URL) };
export const viewport: Viewport = { themeColor: '#0F0D0C' };

// Root layout for short links (/g/<id>), which live outside the [locale] tree.
export default async function ShortLinkLayout({ children }: { children: React.ReactNode }) {
  const locale = pickLocale((await headers()).get('accept-language'));
  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
