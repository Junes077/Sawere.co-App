import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANAGER_ROLES = ["OWNER", "ADMIN"];

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  if (!MANAGER_ROLES.includes(auth.user.role)) {
    return NextResponse.json({ error: "Only firm owners or admins can revoke invites" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const invite = await prisma.invitation.findFirst({ where: { id, firmId: auth.user.firmId } });
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await prisma.invitation.update({ where: { id }, data: { status: "REVOKED" } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to revoke invite", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
