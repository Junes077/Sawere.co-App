import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validators/task";
import { listTasks } from "@/lib/data/tasks";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const tasks = await listTasks(auth.user.firmId);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const parsed = taskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { clientId, caseId, assigneeId, dueAt, ...data } = parsed.data;

  const task = await prisma.task.create({
    data: {
      ...data,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      clientId: clientId || undefined,
      caseId: caseId || undefined,
      assigneeId: assigneeId || undefined,
      firmId: user.firmId,
      createdById: user.id,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
