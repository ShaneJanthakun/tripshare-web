import Image from 'next/image';
import Link from 'next/link';

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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">TripShare</span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
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
            Now available on the App Store
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
            <a
              href="https://apps.apple.com/app/id6778097653"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white text-black rounded-2xl px-6 py-3.5 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-600 leading-none">Download on the</div>
                <div className="text-sm font-semibold leading-tight">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="py-20 px-6 border-t border-border overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">See it in action</h2>
          <p className="text-gray-400 text-center mb-14">Everything you need to plan, share and discover travel — in your pocket.</p>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0">
            {[
              { src: '/screenshots/screen1.png', caption: 'Discover Free Travel Guides' },
              { src: '/screenshots/screen2.png', caption: 'Made by Travelers for Travelers' },
              { src: '/screenshots/screen3.png', caption: 'Build & Share Your Guides' },
              { src: '/screenshots/screen4.png', caption: 'Visual Day-By-Day Blueprints' },
              { src: '/screenshots/screen5.png', caption: 'See Your Route on the Map' },
              { src: '/screenshots/screen6.png', caption: 'Build It Your Way For Free' },
              { src: '/screenshots/screen7.png', caption: 'Make Your Guide Private' },
            ].map((s, i) => (
              <div key={i} className="flex-shrink-0 w-48 snap-start sm:w-auto">
                <div className="rounded-2xl overflow-hidden border border-border shadow-xl">
                  <Image src={s.src} alt={s.caption} width={390} height={844} className="w-full h-auto" />
                </div>
              </div>
            ))}
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

      {/* Features CTA */}
      <section className="py-12 px-6 border-t border-border text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-gray-400 mb-4">Want to see everything TripShare can do?</p>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 bg-surface border border-border hover:border-accent/50 rounded-2xl px-6 py-3 text-sm font-semibold transition-colors"
          >
            View all features →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to explore?</h2>
          <p className="text-gray-400 mb-8">Download TripShare for free and start planning your next adventure.</p>
          <a
            href="https://apps.apple.com/app/id6778097653"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-black rounded-2xl px-6 py-3.5 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <div className="text-xs text-gray-600 leading-none">Download on the</div>
              <div className="text-sm font-semibold leading-tight">App Store</div>
            </div>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} TripShare. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
