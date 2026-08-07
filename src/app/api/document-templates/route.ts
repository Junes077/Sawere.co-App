import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentTemplateSchema } from "@/lib/validators/document-template";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const templates = await prisma.documentTemplate.findMany({
    where: { firmId: auth.user.firmId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = documentTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const template = await prisma.documentTemplate.create({
    data: { ...parsed.data, firmId: auth.user.firmId },
  });

  return NextResponse.json({ template }, { status: 201 });
}
