import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features – TripShare',
  description: 'Everything TripShare can do — from day-by-day itineraries to private guides with access codes.',
};

const SECTIONS = [
  {
    icon: '✏️',
    title: 'Creating a guide',
    desc: 'Start a new guide in seconds. Set your destination, pick a language, and choose your trip type. TripShare handles the rest.',
    items: [
      'Enter destination city and country',
      'Choose guide language — required before publishing',
      'Pick up to 12 tags: City Tour, Hiking, Beach, Road Trip, Foodie, Family, Budget, Luxury, Adventure, Culture, Wildlife, Historic Tour',
      'Set visibility: Public (anyone can discover it) or Private (access code required)',
      'Cover photo with adjustable vertical crop — drag to frame the perfect shot',
      'Guides start as drafts — only you can see them until you tap Complete Guide',
    ],
  },
  {
    icon: '📅',
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
    icon: '📋',
    title: 'Custom sections',
    desc: 'Beyond the itinerary, add any kind of content your guide needs.',
    items: [
      'List — bullet-point items (packing lists, restaurant recommendations, rules)',
      'Note — free-text travel notes and longer descriptions',
      'Gallery — photo collections to showcase a place',
      'Map — visualise all your stops on an interactive map',
      'Accommodation — hotel name, address, booking link and photos in one card',
      'Rename any section heading by tapping it',
      'Reorder sections freely',
    ],
  },
  {
    icon: '🔒',
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
    icon: '🗺️',
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
    icon: '👥',
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
    icon: '🔍',
    title: 'Discovery and feed',
    desc: 'Find guides that matter to you — not just what\'s popular.',
    items: [
      'Home feed shows guides from people you follow first',
      'Then surfaces popular public guides you haven\'t seen',
      'Choose preferred tags and countries during onboarding to shape your feed',
      'Search by destination, city or guide title',
      'Search users by name to find and follow travelers',
      'View and upvote counts visible on every guide card',
      'Feed loads 20 guides at a time and paginates as you scroll',
    ],
  },
  {
    icon: '👤',
    title: 'Your profile',
    desc: 'Everything you\'ve created or loved, in one place.',
    items: [
      'My Guides tab — all your guides with draft/published status',
      'Liked tab — all guides you\'ve upvoted',
      'Following list — manage who you follow with one tap to unfollow',
      'Edit your display name (up to 2 times)',
      'Set a profile photo from your camera roll',
      'Write a short bio visible to other users',
      'Sign out or delete your account from settings',
    ],
  },
  {
    icon: '🌐',
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
    icon: '🔔',
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
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">TripShare</Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-accent text-sm font-medium mb-3 tracking-wide uppercase">The app</p>
          <h1 className="text-4xl font-bold mb-3">How TripShare works</h1>
          <p className="text-gray-400 mb-16 text-lg leading-relaxed">
            Everything you can do in the app — from creating your first guide to sharing it with the world.
          </p>

          <div className="flex flex-col gap-14">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{s.icon}</span>
                  <h2 className="text-xl font-bold text-white">{s.title}</h2>
                </div>
                <p className="text-gray-400 mb-5 leading-relaxed">{s.desc}</p>
                <ul className="space-y-2.5 bg-surface border border-border rounded-2xl p-5">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="text-accent mt-0.5 shrink-0 font-bold">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              Something missing or not working?{' '}
              <a href="mailto:support@tripshare.online" className="text-accent hover:underline">
                support@tripshare.online
              </a>
            </p>
            <Link href="/support" className="text-sm text-accent hover:underline">
              Visit Support →
            </Link>
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
