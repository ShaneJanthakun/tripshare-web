import type { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  );
}
