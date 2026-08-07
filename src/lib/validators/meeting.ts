import { z } from "zod";

export const meetingSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["CLIENT_MEETING", "PHONE_NOTE", "VOICE_MEMO", "COURT_APPEARANCE"]).default("CLIENT_MEETING"),
  startedAt: z.string().min(1),
  clientId: z.string().uuid().optional().or(z.literal("")),
  caseId: z.string().uuid().optional().or(z.literal("")),
});
