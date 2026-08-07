import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
});

export const invoiceSchema = z.object({
  clientId: z.string().uuid(),
  currency: z.string().min(3).max(3).default("KES"),
  dueDate: z.string().optional().or(z.literal("")),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD", "CHEQUE", "OTHER"]).default("BANK_TRANSFER"),
  reference: z.string().max(120).optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  category: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  amount: z.number().positive(),
  incurredAt: z.string().optional().or(z.literal("")),
});
