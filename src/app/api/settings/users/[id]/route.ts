import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANAGER_ROLES = ["OWNER", "ADMIN"];

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["OWNER", "ADMIN", "ADVOCATE", "PARALEGAL", "STAFF", "RESEARCHER", "READ_ONLY"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  if (!MANAGER_ROLES.includes(auth.user.role)) {
    return NextResponse.json({ error: "Only firm owners or admins can manage teammates" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const target = await prisma.user.findFirst({ where: { id, firmId: auth.user.firmId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { isActive, role } = parsed.data;

    if ((role && role !== "OWNER" && target.role === "OWNER") || isActive === false) {
      if (target.role === "OWNER") {
        const otherActiveOwners = await prisma.user.count({
          where: { firmId: auth.user.firmId, role: "OWNER", isActive: true, id: { not: target.id } },
        });
        if (otherActiveOwners === 0) {
          return NextResponse.json(
            { error: "The firm needs at least one active owner — promote someone else first" },
            { status: 400 },
          );
        }
      }
    }

    if (role && ["OWNER", "ADMIN"].includes(role) && auth.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only a firm owner can grant owner or admin access" }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { ...(isActive !== undefined && { isActive }), ...(role && { role }) },
    });

    await prisma.auditLog.create({
      data: {
        firmId: auth.user.firmId,
        userId: auth.user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: target.id,
        metadata: { isActive, role },
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Failed to update teammate", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
