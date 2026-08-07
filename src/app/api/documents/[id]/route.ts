import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";
import { DOCUMENTS_BUCKET } from "@/lib/data/documents";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const document = await prisma.document.findFirst({ where: { id, firmId: user.firmId } });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  await admin.storage.from(DOCUMENTS_BUCKET).remove([document.storagePath]);
  await prisma.document.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "DELETE", entityType: "Document", entityId: id },
  });

  return NextResponse.json({ ok: true });
}
