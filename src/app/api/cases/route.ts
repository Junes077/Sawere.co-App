import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caseSchema } from "@/lib/validators/case";
import { listCases } from "@/lib/data/cases";
import type { CaseStatus } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const cases = await listCases(auth.user.firmId, {
    search: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as CaseStatus) ?? undefined,
  });

  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = caseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, firmId: user.firmId },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  const existing = await prisma.case.findUnique({
    where: { firmId_caseNumber: { firmId: user.firmId, caseNumber: parsed.data.caseNumber } },
  });
  if (existing) {
    return NextResponse.json({ error: "A case with this number already exists" }, { status: 409 });
  }

  const { advocateId, ...data } = parsed.data;

  const newCase = await prisma.case.create({
    data: { ...data, advocateId: advocateId || undefined, firmId: user.firmId },
  });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "CREATE", entityType: "Case", entityId: newCase.id },
  });

  return NextResponse.json({ case: newCase }, { status: 201 });
}
