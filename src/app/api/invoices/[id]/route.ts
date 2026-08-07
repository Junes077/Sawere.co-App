import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({ where: { id, firmId: auth.user.firmId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.invoice.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ invoice: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({ where: { id, firmId: auth.user.firmId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
