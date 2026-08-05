import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '../i18n/navigation';
import Nav from './Nav';
import Footer from './Footer';

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

const FEATURE_ICONS = [
  <svg key="map" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  <svg key="search" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
  <svg key="nav" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>,
  <svg key="grid" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  <svg key="lock" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  <svg key="users" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
];

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function DownloadButton({ label, variant = 'accent' }: { label: string; variant?: 'accent' | 'white' }) {
  const base = 'inline-flex items-center gap-2.5 font-semibold text-sm rounded-2xl px-7 py-4 transition-all hover:-translate-y-0.5';
  const styles = variant === 'accent'
    ? `${base} bg-gradient-to-b from-accent to-accent2 text-white shadow-glow hover:shadow-[0_0_100px_-8px_rgba(255,92,56,0.5)]`
    : `${base} bg-ink text-bg hover:bg-white shadow-xl`;
  return (
    <a href="https://apps.apple.com/app/id6778097653" target="_blank" rel="noopener noreferrer" className={styles}>
      <AppleIcon className="w-5 h-5" />
      {label}
    </a>
  );
}

export default function Home() {
  const t = useTranslations();

  const featureItems = t.raw('features.items') as { title: string; desc: string }[];
  // Bento layout: first and last tiles get double width on large screens
  const span = (i: number) => (i === 0 || i === 5 ? 'lg:col-span-2' : '');

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <Nav />

      {/* Hero */}
      <section className="relative min-h-[92svh] flex items-center px-6 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/30" style={{ zIndex: 1 }} />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg to-transparent" style={{ zIndex: 2 }} />

        <div className="relative max-w-6xl mx-auto w-full pt-24 pb-16" style={{ zIndex: 3 }}>
          <div className="max-w-2xl stagger">
            <h1 className="font-display text-5xl sm:text-7xl font-bold leading-[1.02] tracking-tight mb-6 [text-wrap:balance]">
              {t('hero.title')}<br />
              <span className="bg-gradient-to-r from-accent to-[#FFA07A] bg-clip-text text-transparent">
                {t('hero.titleAccent')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-lg mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <DownloadButton label={t('cta.button')} variant="accent" />
              <Link href="/features" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1.5 px-2 py-3">
                {t('features.seeAll')} <span aria-hidden>→</span>
              </Link>
            </div>
            <p className="text-xs text-faint mt-6">{t('hero.badge')}</p>
          </div>
        </div>
      </section>

      {/* Screenshot marquee */}
      <section className="py-14 overflow-hidden">
        <p className="text-xs text-faint tracking-[0.25em] uppercase text-center mb-8 font-medium">{t('screenshots.label')}</p>
        <div className="relative marquee-track">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg to-transparent z-10" />
          <div className="flex gap-5 w-max animate-marquee marquee-inner">
            {[...SCREENSHOTS, ...SCREENSHOTS].map((s, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 sm:w-56 rounded-[2rem] overflow-hidden border border-white/10 shadow-card transition-transform duration-300 hover:scale-[1.03] hover:border-accent/40"
              >
                <Image src={s.src} alt={s.alt} width={390} height={844} className="w-full h-auto block" priority={i < 4} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tagline statement */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[280px] rounded-full bg-accent/5 blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <p className="font-display text-3xl sm:text-4xl font-semibold leading-snug [text-wrap:balance]">{t('tagline.heading')}</p>
          <p className="text-muted mt-4 text-base leading-relaxed max-w-lg mx-auto">{t('tagline.sub')}</p>
        </div>
      </section>

      {/* Features bento grid */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-center mb-4 tracking-tight [text-wrap:balance]">{t('features.heading')}</h2>
          <p className="text-muted text-center mb-14 max-w-md mx-auto text-sm">{t('features.sub')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureItems.map((f, i) => (
              <div
                key={i}
                className={`relative overflow-hidden bg-surface border border-border rounded-3xl p-7 transition-all duration-300 hover:border-accent/40 hover:bg-s2 hover:-translate-y-1 group ${span(i)}`}
              >
                <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent/[0.06] blur-2xl group-hover:bg-accent/[0.12] transition-colors" />
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-5 group-hover:bg-accent/20 transition-colors">
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="font-display text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/features" className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1.5 border border-border rounded-xl px-5 py-2.5 hover:border-accent/40">
              {t('features.seeAll')} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6">
        <div className="relative max-w-4xl mx-auto text-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-s2 to-surface px-6 py-20">
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
            <div className="w-[500px] h-[260px] rounded-full bg-accent/15 blur-[110px] -mt-20" />
          </div>
          <div className="relative max-w-xl mx-auto">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4 tracking-tight [text-wrap:balance]">{t('cta.heading')}</h2>
            <p className="text-muted mb-10">{t('cta.sub')}</p>
            <DownloadButton label={t('cta.button')} variant="white" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
