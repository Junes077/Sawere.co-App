import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User as AppUser } from "@prisma/client";

/**
 * Resolves the signed-in Supabase auth user into our application User row
 * (which carries firmId, role, and profile fields). Returns null if there is
 * no session or the auth user has no matching profile yet.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  return prisma.user.findUnique({ where: { id: authUser.id } });
}

/**
 * Use in Server Components / Route Handlers that require an authenticated
 * user with a provisioned firm profile. Redirects to /login if there is no
 * session, or to /onboarding if the Supabase account has no firm/profile
 * yet (e.g. a first-time OAuth sign-in).
 */
export async function requireUser(): Promise<AppUser> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) redirect("/onboarding");

  return user;
}

/**
 * Use in Route Handlers (API routes) instead of requireUser() — a redirect()
 * response would otherwise be silently followed by fetch() and break JSON
 * parsing on the client. Returns either the resolved user or a 401 response
 * to return as-is: `const auth = await requireApiUser(); if ("response" in auth) return auth.response;`
 */
export async function requireApiUser(): Promise<{ user: AppUser } | { response: Response }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user };
}
