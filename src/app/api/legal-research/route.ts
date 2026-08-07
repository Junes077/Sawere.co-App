import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { legalResearchNoteSchema } from "@/lib/validators/legal-research";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const notes = await prisma.legalResearchNote.findMany({
    where: { firmId: auth.user.firmId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = legalResearchNoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const note = await prisma.legalResearchNote.create({
    data: { ...parsed.data, firmId: auth.user.firmId },
  });

  return NextResponse.json({ note }, { status: 201 });
}
