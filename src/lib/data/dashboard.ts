import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export async function getDashboardStats(firmId: string) {
  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const [
    clientCount,
    openCaseCount,
    pendingTaskCount,
    upcomingEvents,
    recentPayments,
    unpaidInvoices,
    casesByStatus,
    recentTasks,
  ] = await Promise.all([
    prisma.client.count({ where: { firmId } }),
    prisma.case.count({ where: { firmId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.task.count({ where: { firmId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.calendarEvent.findMany({
      where: { firmId, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { client: true, case: true },
    }),
    prisma.payment.findMany({
      where: { invoice: { firmId }, paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
    prisma.invoice.aggregate({
      where: { firmId, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.case.groupBy({ by: ["status"], where: { firmId }, _count: true }),
    prisma.task.findMany({
      where: { firmId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 5,
      include: { client: true, case: true },
    }),
  ]);

  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);
    const total = recentPayments
      .filter((p) => p.paidAt >= monthStart && p.paidAt <= monthEnd)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    revenueByMonth.push({ month: monthStart.toLocaleString("en-KE", { month: "short" }), revenue: total });
  }

  return {
    clientCount,
    openCaseCount,
    pendingTaskCount,
    upcomingEvents,
    unpaidTotal: Number(unpaidInvoices._sum.total ?? 0),
    unpaidCount: unpaidInvoices._count,
    casesByStatus: casesByStatus.map((c) => ({ status: c.status, count: c._count })),
    revenueByMonth,
    recentTasks,
  };
}
