import { prisma } from "@/lib/prisma";

const INVITE_TTL_DAYS = 7;

export function inviteExpiryDate() {
  return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

/** A still-usable pending invite for this email, if one exists (case-insensitive). */
export async function findPendingInviteByEmail(email: string) {
  const invite = await prisma.invitation.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return invite && !isExpired(invite.expiresAt) ? invite : null;
}

export async function findPendingInviteByToken(token: string) {
  const invite = await prisma.invitation.findUnique({ where: { token }, include: { firm: true } });
  return invite && invite.status === "PENDING" && !isExpired(invite.expiresAt) ? invite : null;
}

/**
 * Creates the User row for an invite and marks it accepted, attaching the
 * new Supabase auth user to the invite's EXISTING firm — this is what keeps
 * a teammate from accidentally provisioning their own separate firm by
 * signing up normally.
 */
export async function acceptInvite(inviteId: string, authUserId: string, fullName: string) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.invitation.findUniqueOrThrow({ where: { id: inviteId } });
    await tx.user.create({
      data: {
        id: authUserId,
        firmId: invite.firmId,
        email: invite.email,
        fullName,
        role: invite.role,
      },
    });
    await tx.invitation.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
  });
}
