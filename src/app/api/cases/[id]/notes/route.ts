import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const noteSchema = z.object({ body: z.string().min(1).max(8000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const caseRecord = await prisma.case.findFirst({ where: { id, firmId: user.firmId } });
  if (!caseRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = noteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const note = await prisma.caseNote.create({
    data: { caseId: id, authorId: user.id, body: parsed.data.body },
    include: { author: true },
  });

  return NextResponse.json({ note }, { status: 201 });
}
