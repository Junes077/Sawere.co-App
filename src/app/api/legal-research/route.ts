import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { legalResearchNoteSchema } from "@/lib/validators/legal-research";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId") ?? undefined;

  try {
    const notes = await prisma.legalResearchNote.findMany({
      where: { firmId: auth.user.firmId, ...(caseId && { caseId }) },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("Failed to load research notes", err);
    const message = err instanceof Error ? err.message : "Couldn't load saved research.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = legalResearchNoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { clientId, caseId, ...data } = parsed.data;

  try {
    const note = await prisma.legalResearchNote.create({
      data: {
        ...data,
        firmId: auth.user.firmId,
        clientId: clientId || undefined,
        caseId: caseId || undefined,
      },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    console.error("Failed to save research note", err);
    const message = err instanceof Error ? err.message : "Couldn't save that note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
