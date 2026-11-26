import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './app/i18n/routing';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/env';

const intl = createIntlMiddleware(routing);

// Only the signed-in areas refresh the Supabase session, so public pages make no network calls
// (plan/01-arkitektur.md, Middleware).
const SESSION_PATHS = /^\/(?:[a-z]{2}\/)?(?:my-guides|edit|feed|liked|profile|login|reset-password)(?:\/|$)/;

export default async function middleware(request: NextRequest) {
  if (!SESSION_PATHS.test(request.nextUrl.pathname)) return intl(request);

  // Refresh first: new cookies go onto the request, which next-intl forwards to the page, and
  // are copied onto the response for the browser.
  const refreshed: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: cookiesToSet => {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          refreshed.push({ name, value, options });
        });
      },
    },
  });
  await supabase.auth.getUser();

  const response = intl(request);
  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  // Outside the middleware: API routes, auth callbacks, short links (/g/<id>),
  // .well-known (apple-app-site-association) and files with an extension.
  matcher: ['/((?!api|auth|g/|_next|_vercel|\\.well-known|.*\\..*).*)'],
};
