import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentMetaSchema } from "@/lib/validators/document";
import { listDocuments } from "@/lib/data/documents";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const documents = await listDocuments(auth.user.firmId, {
    search: searchParams.get("q") ?? undefined,
    clientId: searchParams.get("clientId") ?? undefined,
    caseId: searchParams.get("caseId") ?? undefined,
  });

  return NextResponse.json({ documents });
}

/** Registers metadata for a file the client has already uploaded straight to
 * Supabase Storage (see components/documents/upload-dialog.tsx). */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = documentMetaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { clientId, caseId, ...data } = parsed.data;

  const document = await prisma.document.create({
    data: {
      ...data,
      firmId: user.firmId,
      uploadedById: user.id,
      clientId: clientId || undefined,
      caseId: caseId || undefined,
    },
  });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "CREATE", entityType: "Document", entityId: document.id },
  });

  return NextResponse.json({ document }, { status: 201 });
}
