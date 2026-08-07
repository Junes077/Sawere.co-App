import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { meetingSchema } from "@/lib/validators/meeting";
import { listMeetings } from "@/lib/data/meetings";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const meetings = await listMeetings(auth.user.firmId);
  return NextResponse.json({ meetings });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const parsed = meetingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { clientId, caseId, startedAt, ...data } = parsed.data;

  const meeting = await prisma.meeting.create({
    data: {
      ...data,
      startedAt: new Date(startedAt),
      clientId: clientId || undefined,
      caseId: caseId || undefined,
      hostId: user.id,
      firmId: user.firmId,
    },
  });

  return NextResponse.json({ meeting }, { status: 201 });
}
