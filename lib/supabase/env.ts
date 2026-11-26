// Supabase project settings. The URL and the publishable key are public by design (the app
// ships them too), so they have fallbacks: the site keeps working before the Vercel variables
// exist (plan P5). The service role key never has a fallback — see admin.ts.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://fovddldyfhspgejjkvtd.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_gaU8HM4KiihRkbG3kqL7pw_7NdpdQ-f';
