import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { safeNext, localeFromPath } from '../../../lib/auth/paths';

// Sign-in with Apple/Google (and e-mail links) comes back here: exchange the code for a session
// (PKCE) and continue to `next`. Outside the locale middleware (plan F2.2).
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextParam = url.searchParams.get('next');
  const locale = localeFromPath(nextParam);
  const next = safeNext(nextParam, locale);
  const code = url.searchParams.get('code');
  const providerError = url.searchParams.get('error_description') ?? url.searchParams.get('error');

  if (code && !providerError) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.error('auth/callback:', error.message);
  }
  const login = new URL(`/${locale}/login`, url.origin);
  login.searchParams.set('error', providerError ? 'provider' : 'callback');
  login.searchParams.set('next', next);
  return NextResponse.redirect(login);
}
