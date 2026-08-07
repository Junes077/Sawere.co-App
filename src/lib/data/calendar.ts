import { prisma } from "@/lib/prisma";

export async function listEventsInRange(firmId: string, from: Date, to: Date) {
  return prisma.calendarEvent.findMany({
    where: { firmId, startsAt: { gte: from, lte: to } },
    orderBy: { startsAt: "asc" },
    include: { client: true, case: true },
  });
}
