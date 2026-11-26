import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { ensureProfile } from '../../../lib/auth/profile';

// The signed-in area (plan F2.6): always dynamic, never indexed. The middleware already sends
// visitors without a session to the login page; this is the second line of defence, and it
// creates the profile row the first time someone signs in on the website (F2.3).
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const state = await ensureProfile(supabase, user);
  if (state === 'needsName') redirect(`/${locale}/welcome`);
  return <>{children}</>;
}
