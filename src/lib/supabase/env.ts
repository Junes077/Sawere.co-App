/**
 * Fails fast with a readable message (visible in server logs — Vercel's
 * "Logs" tab, or your terminal in dev) instead of the opaque error the
 * Supabase SDK throws when `NEXT_PUBLIC_SUPABASE_URL` /
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` are undefined. This app is auth-gated on
 * every request (see src/proxy.ts), so missing Supabase config breaks the
 * whole site, not just the pages that use it — this is the first place to
 * check if every route 500s right after a fresh deploy.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(copy .env.example to .env.local for local dev, or add them as Environment Variables in your " +
        "Vercel project settings for a deployment, then redeploy).",
    );
  }

  return { url, anonKey };
}
