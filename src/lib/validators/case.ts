import { z } from "zod";

export const caseSchema = z.object({
  clientId: z.string().uuid(),
  caseNumber: z.string().min(1).max(80),
  title: z.string().min(2).max(300),
  caseType: z.string().min(1).max(120),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "WON", "LOST", "SETTLED", "CLOSED"])
    .default("OPEN"),
  court: z.string().max(200).optional().or(z.literal("")),
  judge: z.string().max(200).optional().or(z.literal("")),
  opposingParty: z.string().max(200).optional().or(z.literal("")),
  advocateId: z.string().uuid().optional().or(z.literal("")),
});

export type CaseInput = z.infer<typeof caseSchema>;
