import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invitationSchema } from "@/lib/validators/invitation";
import { inviteExpiryDate } from "@/lib/invites";

const MANAGER_ROLES = ["OWNER", "ADMIN"];

function describeError(err: unknown): string {
  if (err instanceof Error && err.message.includes("does not exist")) {
    return "The invitations table hasn't been created yet — run supabase/invitations.sql against your database first.";
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.user.role);

  try {
    const [users, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { firmId: auth.user.firmId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          title: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      isManager
        ? prisma.invitation.findMany({
            where: { firmId: auth.user.firmId, status: "PENDING" },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ users, invitations, isManager });
  } catch (err) {
    console.error("Failed to load team", err);
    return NextResponse.json({ error: describeError(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  if (!MANAGER_ROLES.includes(auth.user.role)) {
    return NextResponse.json({ error: "Only firm owners or admins can invite teammates" }, { status: 403 });
  }

  const parsed = invitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { email, role } = parsed.data;

  if (["OWNER", "ADMIN"].includes(role) && auth.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only a firm owner can invite another owner or admin" }, { status: 403 });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { firmId: auth.user.firmId, email: { equals: email, mode: "insensitive" } },
    });
    if (existingUser) {
      return NextResponse.json({ error: "This person is already part of your firm" }, { status: 400 });
    }

    const existingInvite = await prisma.invitation.findFirst({
      where: { firmId: auth.user.firmId, email: { equals: email, mode: "insensitive" }, status: "PENDING" },
    });

    const invite = existingInvite
      ? await prisma.invitation.update({
          where: { id: existingInvite.id },
          data: { role, expiresAt: inviteExpiryDate(), invitedById: auth.user.id },
        })
      : await prisma.invitation.create({
          data: {
            firmId: auth.user.firmId,
            email,
            role,
            expiresAt: inviteExpiryDate(),
            invitedById: auth.user.id,
          },
        });

    await prisma.auditLog.create({
      data: {
        firmId: auth.user.firmId,
        userId: auth.user.id,
        action: "INVITE",
        entityType: "Invitation",
        entityId: invite.id,
        metadata: { email, role },
      },
    });

    return NextResponse.json({ invitation: invite }, { status: 201 });
  } catch (err) {
    console.error("Failed to create invite", err);
    return NextResponse.json({ error: describeError(err) }, { status: 500 });
  }
}
