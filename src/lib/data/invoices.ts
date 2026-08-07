import { prisma } from "@/lib/prisma";

export async function listInvoices(firmId: string) {
  return prisma.invoice.findMany({
    where: { firmId },
    orderBy: { issueDate: "desc" },
    include: { client: true, payments: true, items: true },
  });
}

export async function getInvoiceDetail(firmId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, firmId },
    include: { client: true, items: true, payments: { orderBy: { paidAt: "desc" } } },
  });
}

export async function listExpenses(firmId: string) {
  return prisma.expense.findMany({ where: { firmId }, orderBy: { incurredAt: "desc" } });
}

export async function nextInvoiceNumber(firmId: string) {
  const count = await prisma.invoice.count({ where: { firmId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}
