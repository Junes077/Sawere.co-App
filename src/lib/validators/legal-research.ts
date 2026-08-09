import { z } from "zod";

export const legalResearchNoteSchema = z.object({
  title: z.string().min(1).max(300),
  sourceUrl: z.string().max(500).optional().or(z.literal("")),
  jurisdiction: z.string().max(120).optional().or(z.literal("")),
  practiceArea: z.string().max(60).optional().or(z.literal("")),
  sourceType: z.string().max(40).optional().or(z.literal("")),
  court: z.string().max(200).optional().or(z.literal("")),
  citation: z.string().max(200).optional().or(z.literal("")),
  caseNumber: z.string().max(120).optional().or(z.literal("")),
  summary: z.string().max(4000).optional().or(z.literal("")),
  clientId: z.string().uuid().optional().or(z.literal("")),
  caseId: z.string().uuid().optional().or(z.literal("")),
});
