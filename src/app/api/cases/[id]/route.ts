import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caseSchema } from "@/lib/validators/case";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.case.findFirst({ where: { id, firmId: user.firmId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = caseSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { advocateId, ...data } = parsed.data;

  const updated = await prisma.case.update({
    where: { id },
    data: { ...data, ...(advocateId !== undefined ? { advocateId: advocateId || null } : {}) },
  });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "UPDATE", entityType: "Case", entityId: id },
  });

  return NextResponse.json({ case: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.case.findFirst({ where: { id, firmId: user.firmId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.case.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "DELETE", entityType: "Case", entityId: id },
  });

  return NextResponse.json({ ok: true });
}
