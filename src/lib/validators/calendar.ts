import { z } from "zod";

export const EVENT_TYPES = ["COURT_DATE", "MEETING", "DEADLINE", "EXPIRY_REMINDER", "OTHER"] as const;

export const calendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  type: z.enum(EVENT_TYPES).default("OTHER"),
  startsAt: z.string().min(1),
  endsAt: z.string().optional().or(z.literal("")),
  location: z.string().max(300).optional().or(z.literal("")),
  clientId: z.string().uuid().optional().or(z.literal("")),
  caseId: z.string().uuid().optional().or(z.literal("")),
});
