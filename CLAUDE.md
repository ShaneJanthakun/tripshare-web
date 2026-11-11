# tripshare-web

Nettsiden tripshare.online: Next.js 15.5 (App Router), next-intl 4 og Tailwind 3. Den finnes på 10 språk: en, no, es, fr, pt (europeisk portugisisk, «tu»), th, ja, zh, ko og de.

Siden ligger på Vercel. **Push til `main` publiserer live, så spør Shane før du pusher.** Andre brancher gir en forhåndsvisning, og den bruker **produksjonsdatabasen**.

Hovedplanen ligger i `../plan/README.md`. Arkitektur og datakontrakt står i `../plan/01-arkitektur.md`.

## Kommandoer
- `npm run dev` starter utviklingsserveren.
- `npm run build` bygger. Kjør den alltid før push.
- `npx next start -p 3123` lar deg teste produksjonsbygget lokalt.

## Regler
- **Statiske sider.** Sider under `app/[locale]` ferdigbygges (SSG).
  - `layout.tsx` har `generateStaticParams`.
  - Hver side kaller `setRequestLocale(use(params).locale)` og eksporterer `generateMetadata` via `localizedMetadata()` eller `pageMetadata()` i `app/seo.ts`.
  - Les **aldri** `cookies()` eller `headers()` i statiske sider. Da blir siden dynamisk, og metadata havner utenfor `<head>`.
- **Nye faste sider:** legg siden inn i `PAGE_PATHS` i `app/seo.ts`, og legg `meta.<nøkkel>.title/description` inn i **alle** filene i `messages/*.json`.
- **Sjekk etter bygging:**
  - Markedssidene skal stå som ●/○ i byggeutskriften, ikke ƒ.
  - Canonical, hreflang og beskrivelse skal ligge før `</head>`. Sjekk med `curl` mot `next start`.
- **Domene:** tripshare.online er hoveddomenet, og www sender videre med 308. Canonical, sitemap og hreflang bruker `https://tripshare.online`.
- **Bilder:** Bruk `next/image` med `sizes`. Supabase-bilder hentes via `/storage/v1/render/image/`.
- **Genererte filer – ikke rediger for hånd:**
  - tekster under `app.*` i `messages/*.json`, som lages av `scripts/sync-app-strings.mjs`
  - `lib/core/guide.ts`, som lages av `scripts/sync-core.mjs` fra appen
- **Guidedata** skrives bare etter datakontrakten i `../plan/01-arkitektur.md`. Les også `../plan/11-fallgruver.md`.
