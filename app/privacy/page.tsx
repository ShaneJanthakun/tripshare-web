import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – TripShare',
};

const SECTIONS = [
  {
    title: 'What We Collect',
    body: `When you create an account, we collect your name and email address. When you use TripShare, we store the travel guides you create, including text, images, destinations and trip details. We also store your activity within the app, such as guides you have liked and users you follow.`,
  },
  {
    title: 'How We Use Your Data',
    body: `Your data is used solely to provide and improve TripShare. We use it to display your guides to other users (if you choose to make them public), personalise your feed, and enable social features such as following and liking. We do not sell your personal data to third parties and we do not use it for advertising.`,
  },
  {
    title: 'Data Storage',
    body: `Your data is stored securely using Supabase, a SOC 2 Type II certified cloud database provider. Data is stored on servers in the European Union. All connections are encrypted using TLS.`,
  },
  {
    title: 'Images',
    body: `Photos you upload are stored in Supabase Storage and are publicly accessible via a unique URL if attached to a public guide. If you delete your account, your images are removed along with all your data.`,
  },
  {
    title: 'Third-Party Services',
    body: `TripShare uses Supabase for authentication, database and file storage. We use Apple Maps for location-based features. We do not integrate with advertising networks, analytics trackers or social media platforms.`,
  },
  {
    title: 'Account Deletion',
    body: `You can permanently delete your account at any time from Settings → Delete Account inside the app. Deleting your account removes all your personal data, guides, comments and images from our systems. This action is irreversible.`,
  },
  {
    title: 'Your Rights',
    body: `You have the right to access, correct or delete your personal data at any time. To request a data export or raise a privacy concern, contact us at support@tripshare.online.`,
  },
  {
    title: 'Children',
    body: `TripShare is not directed at children under 13. We do not knowingly collect personal information from anyone under 13. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.`,
  },
  {
    title: 'Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we do, we will update the date below. Continued use of the app after changes constitutes acceptance of the updated policy.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">TripShare</Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-accent text-sm font-medium mb-3 tracking-wide uppercase">Legal</p>
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-12">Last updated: June 2025</p>

          <p className="text-gray-300 leading-relaxed mb-12">
            TripShare (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy.
            This policy explains what information we collect, how we use it, and your rights regarding your data.
          </p>

          <div className="flex flex-col gap-10">
            {SECTIONS.map((s, i) => (
              <section key={s.title}>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/15 text-accent text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  {s.title}
                </h2>
                <p className="text-gray-400 leading-relaxed pl-9">{s.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-border">
            <p className="text-gray-500 text-sm">
              Questions about this policy?{' '}
              <a href="mailto:support@tripshare.online" className="text-accent hover:underline">
                support@tripshare.online
              </a>
            </p>
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
