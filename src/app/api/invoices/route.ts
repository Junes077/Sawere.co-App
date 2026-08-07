import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators/invoice";
import { listInvoices, nextInvoiceNumber } from "@/lib/data/invoices";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const invoices = await listInvoices(auth.user.firmId);
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const parsed = invoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({ where: { id: parsed.data.clientId, firmId: user.firmId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });

  const subtotal = parsed.data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (parsed.data.taxRate / 100);
  const total = subtotal + taxAmount;
  const invoiceNumber = await nextInvoiceNumber(user.firmId);

  const invoice = await prisma.invoice.create({
    data: {
      firmId: user.firmId,
      clientId: parsed.data.clientId,
      invoiceNumber,
      currency: parsed.data.currency,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      notes: parsed.data.notes || undefined,
      subtotal,
      taxAmount,
      total,
      status: "DRAFT",
      items: {
        create: parsed.data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.auditLog.create({
    data: { firmId: user.firmId, userId: user.id, action: "CREATE", entityType: "Invoice", entityId: invoice.id },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
