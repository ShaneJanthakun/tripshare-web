import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

const sb = createClient(
  'https://fovddldyfhspgejjkvtd.supabase.co',
  'sb_publishable_gaU8HM4KiihRkbG3kqL7pw_7NdpdQ-f',
);

interface Guide {
  id: string;
  title: string;
  destination: string;
  country: string;
  upvotes: number;
  data: { coverImage?: string; description?: string; authorName?: string };
}

async function getPublicGuides(): Promise<Guide[]> {
  const { data } = await sb
    .from('guides')
    .select('id, title, destination, country, upvotes, data')
    .order('upvotes', { ascending: false })
    .limit(6);
  return (data ?? []) as Guide[];
}

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Day-by-day itineraries',
    desc: 'Build detailed guides with stops, maps, tips and photos for every day of your trip.',
  },
  {
    icon: '🌍',
    title: 'Discover real trips',
    desc: 'Browse guides made by real travelers — not algorithms. Find hidden gems you won\'t see anywhere else.',
  },
  {
    icon: '❤️',
    title: 'Save what you love',
    desc: 'Like guides and they\'ll live on your profile, ready whenever you start planning.',
  },
  {
    icon: '✈️',
    title: 'Share your adventure',
    desc: 'Publish your guides publicly or keep them private. Inspire others or just stay organized.',
  },
];

export default async function Home() {
  const guides = await getPublicGuides();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">TripShare</span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="#guides" className="hover:text-white transition-colors">Guides</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 text-sm text-gray-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Coming soon to the App Store
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
            Share your journey.<br />
            <span className="text-accent">Inspire the world.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Create beautiful travel guides with maps, photos and day-by-day itineraries.
            Discover trips from real travelers — not influencers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-6 py-3.5">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-500 leading-none">Coming soon</div>
                <div className="text-sm font-semibold leading-tight">App Store</div>
              </div>
            </div>

            <Link
              href="#guides"
              className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
            >
              See real guides ↓
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Everything you need to travel smarter</h2>
          <p className="text-gray-400 text-center mb-14">Built for travelers who love to plan and share.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-surface border border-border rounded-2xl p-6 hover:border-accent/40 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live guides from Supabase */}
      {guides.length > 0 && (
        <section id="guides" className="py-20 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3">Real guides, real travelers</h2>
            <p className="text-gray-400 text-center mb-14">A glimpse of what's waiting for you in the app.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {guides.map(g => (
                <div key={g.id} className="bg-surface border border-border rounded-2xl overflow-hidden group hover:border-accent/40 transition-all">
                  <div className="h-40 bg-s2 relative overflow-hidden">
                    {g.data?.coverImage ? (
                      <Image
                        src={g.data.coverImage}
                        alt={g.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-gray-700">
                        {(g.destination ?? '?').charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-white font-bold text-base leading-tight line-clamp-1">{g.title}</p>
                      <p className="text-gray-300 text-xs">{g.destination}{g.country ? `, ${g.country}` : ''}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{g.data?.authorName ?? 'AI Explorer'}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-accent">♥</span> {g.upvotes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to explore?</h2>
          <p className="text-gray-400 mb-8">TripShare is coming to the App Store soon. Your next adventure starts here.</p>
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-5 py-2 text-accent text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Launching soon
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} TripShare. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
