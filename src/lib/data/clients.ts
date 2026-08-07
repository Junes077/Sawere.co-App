import { prisma } from "@/lib/prisma";

export async function listClients(firmId: string, search?: string) {
  return prisma.client.findMany({
    where: {
      firmId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { companyName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cases: true } } },
  });
}

export async function getClientDetail(firmId: string, id: string) {
  return prisma.client.findFirst({
    where: { id, firmId },
    include: {
      cases: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" }, take: 20 },
      meetings: { orderBy: { startedAt: "desc" }, take: 20, include: { recording: { include: { transcript: true } } } },
      invoices: { orderBy: { issueDate: "desc" }, include: { payments: true } },
      tasks: { orderBy: { createdAt: "desc" }, take: 20 },
      calendarEvents: { orderBy: { startsAt: "desc" }, take: 20 },
    },
  });
}
