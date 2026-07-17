import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features – TripShare',
  description: 'Everything TripShare can do — from day-by-day itineraries to private guides with access codes.',
};

const SECTIONS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    title: 'Creating a guide',
    desc: 'Start a new guide in seconds. Set your destination, pick a language, and choose your trip type.',
    items: [
      'Enter destination city and country',
      'Choose guide language — required before publishing',
      'Pick up to 12 tags: City Tour, Hiking, Beach, Road Trip, Foodie, Family, Budget, Luxury, and more',
      'Set visibility: Public (anyone can discover it) or Private (access code required)',
      'Cover photo with adjustable vertical crop',
      'Guides start as drafts — only you can see them until you tap Complete Guide',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Day-by-day itinerary',
    desc: 'Break your trip into days. Each day gets its own card with as many stops as you need.',
    items: [
      'Add unlimited days, each with a custom label',
      'Each stop has a name, address, notes and photos',
      'Tap any address to open it directly in Apple Maps',
      'Reorder days and stops freely with up/down arrows',
      'Tap a day heading to rename it',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    title: 'Custom sections',
    desc: 'Beyond the itinerary, add any kind of content your guide needs.',
    items: [
      'List — bullet-point items (packing lists, restaurant recommendations)',
      'Note — free-text travel notes and longer descriptions',
      'Gallery — photo collections to showcase a place',
      'Map — visualise all your stops on an interactive map',
      'Accommodation — hotel name, address, booking link and photos',
      'Rename any section heading by tapping it',
      'Reorder sections freely',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Privacy and access codes',
    desc: 'Full control over who sees your guides.',
    items: [
      'Public guides appear in the feed and can be found by anyone',
      'Private guides require a 4-character access code to view',
      'Access codes are auto-generated when you switch to Private',
      'Share the code with friends — they enter it when opening your guide link',
      'Toggle between Public and Private at any time from within the guide',
      'Private guides never appear in the public feed',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
    ),
    title: 'Maps',
    desc: 'See your whole trip on a map, not just a list.',
    items: [
      'Every guide has a Map tab showing all stops with addresses',
      'Tap any address in a stop to open Apple Maps for directions',
      'Custom Map sections let you build a focused route for part of your trip',
      'Map auto-fits to show all your pins when it loads',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Social features',
    desc: 'TripShare is built for community — discover guides from people whose taste you trust.',
    items: [
      'Follow other travelers to see their guides first in your feed',
      'Like guides — they save to your profile for easy access later',
      'Comment on guides to ask questions or share tips',
      'Guide owners can disable comments on their guides',
      'View any user\'s public profile with their guides and stats',
      'Block users to hide their comments',
      'Report inappropriate guides directly from the guide page',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Discovery and feed',
    desc: 'Find guides that matter to you — not just what\'s popular.',
    items: [
      'Home feed shows guides from people you follow first',
      'Then surfaces popular public guides you haven\'t seen',
      'Choose preferred tags and countries during onboarding to shape your feed',
      'Search by destination, city or guide title',
      'Search users by name to find and follow travelers',
      'Feed loads 20 guides at a time and paginates as you scroll',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: 'Your profile',
    desc: 'Everything you\'ve created or loved, in one place.',
    items: [
      'My Guides tab — all your guides with draft/published status',
      'Liked tab — all guides you\'ve upvoted',
      'Following list — manage who you follow with one tap to unfollow',
      'Edit your display name and profile photo',
      'Write a short bio visible to other users',
      'Sign out or delete your account from settings',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
    title: 'Sharing',
    desc: 'Send your guide to anyone — inside or outside the app.',
    items: [
      'Share any guide via the iOS share sheet',
      'Public guides: anyone with the link can view them in the app',
      'Private guides: link + access code is automatically included when sharing',
      'Share from inside the guide or via the three-dot menu',
    ],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: 'Notifications',
    desc: 'Stay in the loop when things happen on your guides.',
    items: [
      'Get notified when someone follows you',
      'Notifications use iOS push — enable them when prompted',
    ],
  },
];

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-white">

      {/* Nav — matches main page */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight">TripShare</Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/features" className="text-white">Features</Link>
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

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-accent text-xs font-semibold mb-3 tracking-widest uppercase">The app</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">How TripShare works</h1>
          <p className="text-gray-500 mb-16 text-base leading-relaxed max-w-xl">
            Everything you can do in the app — from creating your first guide to sharing it with the world.
          </p>

          <div className="flex flex-col gap-10">
            {SECTIONS.map((s) => (
              <section key={s.title} className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    {s.icon}
                  </div>
                  <h2 className="text-base font-bold text-white">{s.title}</h2>
                </div>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed pl-11">{s.desc}</p>
                <ul className="space-y-2.5 pl-11">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              Something missing?{' '}
              <a href="mailto:support@tripshare.online" className="text-accent hover:underline">
                support@tripshare.online
              </a>
            </p>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer — matches main page */}
      <footer className="border-t border-border py-8 px-6">
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
