import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validators/invoice";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, firmId: auth.user.firmId },
    include: { payments: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = paymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      reference: parsed.data.reference || undefined,
    },
  });

  const totalPaid =
    invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + parsed.data.amount;
  const newStatus =
    totalPaid >= Number(invoice.total) ? "PAID" : totalPaid > 0 ? "PARTIALLY_PAID" : invoice.status;

  await prisma.invoice.update({ where: { id }, data: { status: newStatus } });

  return NextResponse.json({ payment }, { status: 201 });
}
