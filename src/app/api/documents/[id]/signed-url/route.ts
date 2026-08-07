import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";
import { DOCUMENTS_BUCKET } from "@/lib/data/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const document = await prisma.document.findFirst({ where: { id, firmId: auth.user.firmId } });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.storagePath, 60 * 5);

  if (error || !data) {
    return NextResponse.json({ error: "Could not create a download link" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
