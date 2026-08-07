import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  title: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  sessionTimeoutMinutes: z.number().int().min(5).max(480).optional(),
  biometricEnabled: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: auth.user.id }, data: parsed.data });
  return NextResponse.json({ user });
}
