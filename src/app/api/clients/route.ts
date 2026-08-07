import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators/client";
import { listClients } from "@/lib/data/clients";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;

  const clients = await listClients(auth.user.firmId, search);
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: { ...parsed.data, firmId: user.firmId },
  });

  await prisma.auditLog.create({
    data: {
      firmId: user.firmId,
      userId: user.id,
      action: "CREATE",
      entityType: "Client",
      entityId: client.id,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
