import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const preferencesSchema = z.object({
  language: z.enum(["en", "sw"]).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      desktop: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = preferencesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const current = (auth.user.preferences as Record<string, unknown>) ?? {};
  const merged = {
    ...current,
    ...parsed.data,
    notifications: {
      ...(current.notifications as Record<string, unknown> | undefined),
      ...parsed.data.notifications,
    },
  };

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: { preferences: merged as Prisma.InputJsonValue },
  });

  return NextResponse.json({ user });
}
