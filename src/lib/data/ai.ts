import { prisma } from "@/lib/prisma";

export async function listConversations(firmId: string, userId: string) {
  return prisma.aiConversation.findMany({
    where: { firmId, userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(firmId: string, userId: string, id: string) {
  return prisma.aiConversation.findFirst({
    where: { id, firmId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

/** Assembles a compact snapshot of the firm's live data so the assistant can
 * answer questions grounded in real records instead of guessing. */
export async function buildFirmContext(firmId: string) {
  const now = new Date();
  const [clients, openCases, upcomingEvents, pendingTasks] = await Promise.all([
    prisma.client.findMany({ where: { firmId }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.case.findMany({
      where: { firmId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { client: true },
    }),
    prisma.calendarEvent.findMany({
      where: { firmId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 15,
    }),
    prisma.task.findMany({
      where: { firmId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: { dueAt: "asc" },
      take: 25,
    }),
  ]);

  return `FIRM SNAPSHOT (as of ${now.toISOString()})

Clients (${clients.length} shown):
${clients.map((c) => `- ${c.fullName}${c.companyName ? ` (${c.companyName})` : ""}`).join("\n") || "None yet."}

Open cases (${openCases.length} shown):
${
  openCases
    .map((c) => `- ${c.title} [${c.caseNumber}] · client: ${c.client.fullName} · status: ${c.status}`)
    .join("\n") || "None yet."
}

Upcoming calendar events:
${
  upcomingEvents
    .map((e) => `- ${e.title} (${e.type}) on ${e.startsAt.toISOString()}`)
    .join("\n") || "Nothing scheduled."
}

Pending tasks:
${
  pendingTasks
    .map((t) => `- ${t.title} [${t.priority}]${t.dueAt ? ` due ${t.dueAt.toISOString()}` : ""}`)
    .join("\n") || "No pending tasks."
}`;
}
