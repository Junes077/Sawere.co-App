import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";
import { recordingCreateSchema } from "@/lib/validators/recording";
import { RECORDINGS_BUCKET } from "@/lib/data/meetings";

/** Registers metadata for audio the client has already uploaded straight to
 * Supabase Storage (see components/meetings/recording-button.tsx). Re-recording
 * an already-recorded meeting replaces the prior recording and transcript. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id: meetingId } = await params;

  const meeting = await prisma.meeting.findFirst({ where: { id: meetingId, firmId: user.firmId } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = recordingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.recording.findUnique({ where: { meetingId } });
  if (existing) {
    await prisma.recording.delete({ where: { id: existing.id } });
    const admin = createAdminClient();
    await admin.storage.from(RECORDINGS_BUCKET).remove([existing.storagePath]);
  }

  const recording = await prisma.recording.create({
    data: { meetingId, ...parsed.data, status: "RECORDED" },
  });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "CREATE", entityType: "Recording", entityId: recording.id },
  });

  return NextResponse.json({ recording }, { status: 201 });
}
