import Image from 'next/image';
import Link from 'next/link';

const SCREENSHOTS = [
  { src: '/screenshots/screen1.png', alt: 'Discover Travel Guides' },
  { src: '/screenshots/screen2.png', alt: 'Made By Travelers For Travelers' },
  { src: '/screenshots/screen3.png', alt: 'Build & Share Your Guides' },
  { src: '/screenshots/screen4.png', alt: 'Day-By-Day Blueprints' },
  { src: '/screenshots/screen5.png', alt: 'Map Integration' },
  { src: '/screenshots/screen6.png', alt: 'Build It Your Way' },
  { src: '/screenshots/screen7.png', alt: 'Make Your Guides Private' },
  { src: '/screenshots/screen8.png', alt: 'Discover guides by people who have been there' },
];

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Day-by-day itineraries',
    desc: 'Real stops, real addresses. Every day of your trip laid out with maps and tips.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: 'Discover real trips',
    desc: 'Browse guides from real travelers. Hidden gems you won\'t find on any algorithm.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    ),
    title: 'Map integration',
    desc: 'Every stop plotted on a map. Tap any address to open directly in Apple Maps.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    title: 'Build it your way',
    desc: 'Days, lists, notes, galleries, accommodation — structure your guide however makes sense.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Public or private',
    desc: 'Share with the world or keep it private with a personal access code.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Built for community',
    desc: 'Follow travelers, like guides and build a feed that actually reflects how you travel.',
  },
];

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function DownloadButton({ variant = 'accent' }: { variant?: 'accent' | 'white' }) {
  const base = 'inline-flex items-center gap-2.5 font-bold text-sm rounded-xl px-6 py-3.5 transition-colors';
  const styles = variant === 'accent'
    ? `${base} bg-accent text-white hover:bg-orange-500 shadow-lg shadow-accent/20`
    : `${base} bg-white text-black hover:bg-gray-100 shadow-xl`;
  return (
    <a href="https://apps.apple.com/app/id6778097653" target="_blank" rel="noopener noreferrer" className={styles}>
      <AppleIcon className="w-5 h-5" />
      Download on the App Store
    </a>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-white">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight">TripShare</Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/support" className="hover:text-white transition-colors hidden sm:block">Support</Link>
            <Link href="/privacy" className="hover:text-white transition-colors hidden sm:block">Privacy</Link>
            <a
              href="https://apps.apple.com/app/id6778097653"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black text-xs font-semibold rounded-xl px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-28 px-6 text-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-bg/72" style={{ zIndex: 1 }} />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-bg to-transparent" style={{ zIndex: 2 }} />

        <div className="relative max-w-2xl mx-auto" style={{ zIndex: 3 }}>
          <div className="inline-flex items-center gap-2 bg-surface/80 border border-border rounded-full px-4 py-1.5 text-xs text-gray-400 mb-10 font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Free on the App Store
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
            The travel app built by<br />
            <span className="text-accent">people who actually go</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed">
            Create day-by-day travel guides with real stops, maps and photos — and discover trips shared by people who&apos;ve actually been there. No ads. No influencers. Just honest travel.
          </p>

          <DownloadButton variant="accent" />
          <p className="text-xs text-gray-600 mt-5">Free · iOS</p>
        </div>
      </section>

      {/* Screenshots carousel */}
      <section className="py-12 overflow-hidden">
        <p className="text-xs text-gray-500 tracking-widest uppercase text-center mb-6 font-medium">See it in action</p>
        <div className="relative">
          {/* left/right fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg to-transparent z-10" />
          <div
            className="flex gap-4 px-10"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {SCREENSHOTS.map((s, i) => (
              <div key={i} className="flex-shrink-0 w-48 sm:w-52 rounded-3xl overflow-hidden border border-border shadow-2xl shadow-black/40">
                <Image src={s.src} alt={s.alt} width={390} height={844} className="w-full h-auto block" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section className="py-20 px-6 border-t border-border text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-2xl sm:text-3xl font-semibold leading-snug">
            Real itineraries from real travelers.
          </p>
          <p className="text-gray-500 mt-3 text-base leading-relaxed">
            Not AI-generated. Not sponsored. Just people who have been there — sharing exactly where they went and what they did.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 tracking-tight">
            Everything you need to travel smarter
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-md mx-auto text-sm">
            Built for travelers who plan carefully and share generously.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-surface border border-border rounded-2xl p-6 hover:border-accent/30 transition-all hover:bg-s2 group">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/features" className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1">
              See all features <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-28 px-6 border-t border-border text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[300px] rounded-full bg-accent/8 blur-[120px]" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">Start exploring today</h2>
          <p className="text-gray-500 mb-10">Free to download. Free to use. Always.</p>
          <DownloadButton variant="white" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span>© {new Date().getFullYear()} TripShare</span>
            <span className="text-xs text-gray-600">Janthakun Tech · Org.nr. 931 202 162</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
