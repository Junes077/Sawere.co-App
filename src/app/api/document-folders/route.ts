import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentFolderSchema } from "@/lib/validators/document";
import { listDocumentFolders } from "@/lib/data/documents";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const folders = await listDocumentFolders(auth.user.firmId);
  return NextResponse.json({ folders });
}

/** Registers a folder the advocate has opted in to let the AI Document
 * Brain index. Nothing is scanned automatically — actual filesystem
 * indexing runs from the desktop shell (see docs/DESKTOP.md) and calls
 * back into this same API once wired up. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const parsed = documentFolderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const folder = await prisma.documentFolder.create({
    data: { ...parsed.data, firmId: user.firmId },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
