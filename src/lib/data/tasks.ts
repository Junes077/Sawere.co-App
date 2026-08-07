import { prisma } from "@/lib/prisma";

export async function listTasks(firmId: string) {
  return prisma.task.findMany({
    where: { firmId },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    include: { client: true, case: true, assignee: true },
  });
}
