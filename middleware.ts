import createMiddleware from 'next-intl/middleware';
import { routing } from './app/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Outside the locale middleware: API routes, auth callbacks, short links (/g/<id>),
  // .well-known (apple-app-site-association) and files with an extension.
  matcher: ['/((?!api|auth|g/|_next|_vercel|\\.well-known|.*\\..*).*)'],
};
