import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators/invoice";
import { listExpenses } from "@/lib/data/invoices";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const expenses = await listExpenses(auth.user.firmId);
  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const parsed = expenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      incurredAt: parsed.data.incurredAt ? new Date(parsed.data.incurredAt) : undefined,
      firmId: user.firmId,
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
