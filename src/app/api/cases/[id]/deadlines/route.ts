import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const deadlineSchema = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.string().datetime().or(z.string().min(1)),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const caseRecord = await prisma.case.findFirst({ where: { id, firmId: user.firmId } });
  if (!caseRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = deadlineSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const deadline = await prisma.caseDeadline.create({
    data: { caseId: id, title: parsed.data.title, dueAt: new Date(parsed.data.dueAt) },
  });

  return NextResponse.json({ deadline }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const caseRecord = await prisma.case.findFirst({ where: { id, firmId: user.firmId } });
  if (!caseRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = z.object({ deadlineId: z.string().uuid(), isCompleted: z.boolean() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const deadline = await prisma.caseDeadline.update({
    where: { id: parsed.data.deadlineId, caseId: id },
    data: { isCompleted: parsed.data.isCompleted },
  });

  return NextResponse.json({ deadline });
}
