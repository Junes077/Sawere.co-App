import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const brandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  officePhotoUrl: z.string().url().optional(),
});

/** Saves the public URL of a logo/office photo the client already uploaded
 * directly to the "branding" Supabase Storage bucket. */
export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  if (!["OWNER", "ADMIN"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Only firm owners or admins can update branding" }, { status: 403 });
  }

  const parsed = brandingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const firm = await prisma.firm.update({ where: { id: auth.user.firmId }, data: parsed.data });
  return NextResponse.json({ firm });
}
