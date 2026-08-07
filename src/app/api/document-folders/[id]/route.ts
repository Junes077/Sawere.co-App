import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const folder = await prisma.documentFolder.findFirst({ where: { id, firmId: auth.user.firmId } });
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.documentFolder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
