import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support – TripShare',
};

const FAQ = [
  {
    q: 'How do I create a travel guide?',
    a: 'Tap the + button on the home screen, enter a destination, choose your tags and visibility, then tap Create. You\'ll be taken straight to the guide editor where you can add days, stops, tips and photos.',
  },
  {
    q: 'Can I make my guide private?',
    a: 'Yes. You can toggle between Public and Private at any time from within the guide. Private guides are only visible to you.',
  },
  {
    q: 'How do I add images to my guide?',
    a: 'Open any guide you own and tap the camera icon at the top of the cover image. You can drag the photo to position it exactly how you want it.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile → Settings → Delete Account. This permanently removes all your data, guides and images. The action cannot be undone.',
  },
  {
    q: 'Why can\'t I comment on some guides?',
    a: 'Some guides, including our AI Explorer guides, have comments disabled by the creator.',
  },
  {
    q: 'I found a bug or something isn\'t working.',
    a: 'Please email us at support@tripshare.online and describe what happened. We read every message and aim to respond within 48 hours.',
  },
];

export default function Support() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">TripShare</Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-accent text-sm font-medium mb-3 tracking-wide uppercase">Help centre</p>
          <h1 className="text-4xl font-bold mb-3">Support</h1>
          <p className="text-gray-400 mb-12 text-lg leading-relaxed">
            Can't find what you're looking for? Email us and we'll get back to you within 48 hours.
          </p>

          {/* Contact card */}
          <a
            href="mailto:support@tripshare.online"
            className="flex items-center gap-4 bg-surface border border-border hover:border-accent/50 rounded-2xl p-5 mb-16 transition-colors group"
          >
            <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">Email Support</p>
              <p className="text-sm text-accent">support@tripshare.online</p>
            </div>
            <svg className="w-4 h-4 text-gray-600 ml-auto group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>

          {/* FAQ */}
          <h2 className="text-2xl font-bold mb-8">Frequently asked questions</h2>
          <div className="flex flex-col gap-px rounded-2xl overflow-hidden border border-border">
            {FAQ.map((item, i) => (
              <details key={i} className="bg-surface group">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium hover:text-white transition-colors list-none">
                  {item.q}
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} TripShare. All rights reserved.</span>
          <Link href="/" className="hover:text-white transition-colors">← Back to home</Link>
        </div>
      </footer>
    </div>
  );
}
