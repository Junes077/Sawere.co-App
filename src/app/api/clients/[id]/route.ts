import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators/client";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const client = await prisma.client.findFirst({ where: { id, firmId: auth.user.firmId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ client });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.client.findFirst({ where: { id, firmId: user.firmId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = clientSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const client = await prisma.client.update({ where: { id }, data: parsed.data });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "UPDATE", entityType: "Client", entityId: id },
  });

  return NextResponse.json({ client });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.client.findFirst({ where: { id, firmId: user.firmId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "DELETE", entityType: "Client", entityId: id },
  });

  return NextResponse.json({ ok: true });
}
