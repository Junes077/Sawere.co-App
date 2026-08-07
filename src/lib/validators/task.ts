import { z } from "zod";

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const taskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().or(z.literal("")),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
  dueAt: z.string().optional().or(z.literal("")),
  clientId: z.string().uuid().optional().or(z.literal("")),
  caseId: z.string().uuid().optional().or(z.literal("")),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
});
