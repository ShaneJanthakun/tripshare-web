import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '../../../lib/supabase/server';
import { safeNext, localeFromPath } from '../../../lib/auth/paths';

// Links in Supabase e-mails (password reset) land here with a token_hash. Verifying it on the
// server works even when the link is opened on another device than the one that asked for it —
// unlike the PKCE code, which needs the same browser.
export const dynamic = 'force-dynamic';
const TYPES: EmailOtpType[] = ['recovery', 'signup', 'invite', 'magiclink', 'email_change', 'email'];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextParam = url.searchParams.get('next');
  const locale = localeFromPath(nextParam);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = safeNext(nextParam, locale);

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const to = new URL(next, url.origin);
      if (type === 'recovery') to.searchParams.set('step', 'new');
      return NextResponse.redirect(to);
    }
    console.error('auth/confirm:', error.message);
  }
  const back = new URL(`/${locale}/reset-password`, url.origin);
  back.searchParams.set('error', 'expired');
  return NextResponse.redirect(back);
}
