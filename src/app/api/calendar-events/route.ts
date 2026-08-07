import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarEventSchema } from "@/lib/validators/calendar";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const parsed = calendarEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { clientId, caseId, endsAt, ...data } = parsed.data;

  const event = await prisma.calendarEvent.create({
    data: {
      ...data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: endsAt ? new Date(endsAt) : undefined,
      clientId: clientId || undefined,
      caseId: caseId || undefined,
      firmId: user.firmId,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
