import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { acceptInvite, findPendingInviteByEmail } from "@/lib/invites";

const onboardingSchema = z.object({
  firmName: z.string().min(2).max(120),
  fullName: z.string().min(2).max(120),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Provisions a Firm + User profile for an already-authenticated Supabase
 * user who has no profile yet (typically a first-time OAuth sign-in). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { firmName, fullName } = parsed.data;

  const invite = await findPendingInviteByEmail(authUser.email ?? "");
  if (invite) {
    await acceptInvite(invite.id, authUser.id, fullName);
    return NextResponse.json({ ok: true });
  }

  const baseSlug = slugify(firmName) || "firm";
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.firm.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  await prisma.firm.create({
    data: {
      name: firmName,
      slug,
      users: {
        create: {
          id: authUser.id,
          email: authUser.email ?? "",
          fullName,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
