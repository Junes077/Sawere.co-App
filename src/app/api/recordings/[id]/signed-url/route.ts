import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";
import { RECORDINGS_BUCKET } from "@/lib/data/meetings";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const recording = await prisma.recording.findFirst({
    where: { id, meeting: { firmId: auth.user.firmId } },
  });
  if (!recording) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(RECORDINGS_BUCKET)
    .createSignedUrl(recording.storagePath, 60 * 60);

  if (error || !data) {
    return NextResponse.json({ error: "Could not create a playback link" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
