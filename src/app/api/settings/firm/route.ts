import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const firmSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  address: z.string().max(400).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().max(200).optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  if (!["OWNER", "ADMIN"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Only firm owners or admins can edit firm details" }, { status: 403 });
  }

  const parsed = firmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const firm = await prisma.firm.update({ where: { id: auth.user.firmId }, data: parsed.data });
  return NextResponse.json({ firm });
}
