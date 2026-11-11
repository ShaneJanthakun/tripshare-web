// Universal links: lets iOS open these paths in the TripShare app (app.json → ios.associatedDomains
// "applinks:tripshare.online", app v1.3+). Must be served as JSON at exactly this path, with no
// redirect. Only guide links are claimed — the site's own pages (login, editing) stay in the browser.
// The paths must match guideIdFromUrl() in the app (App.tsx) and plan F1.7.
export const dynamic = 'force-static';

// Team ID (Apple Developer → Membership) + bundle id. Not secret.
const APP_ID = 'Q4LTJKLQCJ.com.shanejanthakun.tripshare';

const AASA = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: [
          { '/': '/g/*', comment: 'Short links to guides, shared from the app' },
          { '/': '/*/guide/*', comment: 'Guide pages, e.g. /en/guide/<id>/<slug>' },
        ],
      },
    ],
  },
};

export function GET() {
  return Response.json(AASA, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
