import { prisma } from "@/lib/prisma";
import type { CaseStatus } from "@prisma/client";

export async function listCases(firmId: string, opts: { search?: string; status?: CaseStatus }) {
  return prisma.case.findMany({
    where: {
      firmId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.search
        ? {
            OR: [
              { title: { contains: opts.search, mode: "insensitive" } },
              { caseNumber: { contains: opts.search, mode: "insensitive" } },
              { client: { fullName: { contains: opts.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: true, advocate: true },
  });
}

export async function getCaseDetail(firmId: string, id: string) {
  return prisma.case.findFirst({
    where: { id, firmId },
    include: {
      client: true,
      advocate: true,
      documents: { orderBy: { createdAt: "desc" } },
      calendarEvents: { orderBy: { startsAt: "asc" } },
      meetings: { orderBy: { startedAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      deadlines: { orderBy: { dueAt: "asc" } },
      legalResearchNotes: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listFirmAdvocates(firmId: string) {
  return prisma.user.findMany({
    where: { firmId, role: { in: ["OWNER", "ADMIN", "ADVOCATE"] }, isActive: true },
    orderBy: { fullName: "asc" },
  });
}
