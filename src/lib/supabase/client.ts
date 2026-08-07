import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Safe to use in Client Components — relies on
 * the public anon key, which is subject to Row Level Security policies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
