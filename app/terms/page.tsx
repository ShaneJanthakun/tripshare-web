import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use – TripShare',
};

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body: `By downloading, installing or using TripShare, you agree to be bound by these Terms of Use. If you do not agree to these terms, do not use the app. These terms apply to all users of TripShare, including users who create and share content.`,
  },
  {
    title: 'Eligibility',
    body: `You must be at least 13 years old to use TripShare. By using the app, you confirm that you meet this age requirement. If you are under 18, you must have permission from a parent or guardian.`,
  },
  {
    title: 'Your Account',
    body: `You are responsible for maintaining the security of your account and for all activity that occurs under it. You must provide accurate information when creating your account. Do not share your login credentials with others. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: 'User Content',
    body: `You retain ownership of the content you create and share on TripShare, including travel guides, photos and descriptions. By publishing content on TripShare, you grant us a non-exclusive, royalty-free licence to display and distribute that content within the app. You are solely responsible for the content you post. Do not upload content that is illegal, harmful, misleading, or that infringes on the rights of others.`,
  },
  {
    title: 'Prohibited Conduct',
    body: `You agree not to: use TripShare for any unlawful purpose; post false, misleading or harmful content; harass, threaten or abuse other users; attempt to gain unauthorised access to our systems; scrape, copy or redistribute content without permission; impersonate any person or entity; or use the app to distribute spam or malware.`,
  },
  {
    title: 'Private Guides and Access Codes',
    body: `When you create a private guide, you receive a 4-character access code. You are responsible for deciding who you share this code with. We are not responsible for any access to your private guide resulting from you sharing the code.`,
  },
  {
    title: 'Intellectual Property',
    body: `TripShare and all associated branding, design and technology are owned by us and protected by applicable intellectual property laws. You may not copy, modify, distribute or reverse-engineer any part of the app without our written permission.`,
  },
  {
    title: 'Disclaimers',
    body: `TripShare is provided "as is" without warranties of any kind. Travel guides on TripShare are created by users and we do not verify the accuracy of any guide content. Always exercise your own judgement when following travel advice and check official sources for important information such as visa requirements, safety advisories and entry restrictions.`,
  },
  {
    title: 'Limitation of Liability',
    body: `To the maximum extent permitted by law, TripShare and its operators are not liable for any indirect, incidental, special or consequential damages arising from your use of the app or any content within it. Our total liability for any claim shall not exceed the amount you paid us in the twelve months preceding the claim.`,
  },
  {
    title: 'Account Deletion',
    body: `You can delete your account at any time from Settings → Delete Account within the app. This permanently removes your profile, guides, comments and associated data. We may also suspend or terminate your account if you violate these terms.`,
  },
  {
    title: 'Changes to These Terms',
    body: `We may update these Terms of Use from time to time. We will update the date at the top of this page when we do. Continued use of TripShare after changes have been made constitutes your acceptance of the updated terms.`,
  },
  {
    title: 'Governing Law',
    body: `These terms are governed by the laws of Norway. Any disputes arising from these terms or your use of TripShare shall be subject to the exclusive jurisdiction of the courts of Norway.`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">TripShare</Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-accent text-sm font-medium mb-3 tracking-wide uppercase">Legal</p>
          <h1 className="text-4xl font-bold mb-3">Terms of Use</h1>
          <p className="text-gray-500 text-sm mb-12">Last updated: July 2026</p>

          <p className="text-gray-300 leading-relaxed mb-12">
            These Terms of Use govern your access to and use of TripShare (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;).
            Please read them carefully before using the app.
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
              Questions about these terms?{' '}
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
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-white transition-colors">← Back to home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
