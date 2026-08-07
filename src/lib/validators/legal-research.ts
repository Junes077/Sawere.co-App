import { z } from "zod";

export const legalResearchNoteSchema = z.object({
  title: z.string().min(1).max(300),
  sourceUrl: z.string().max(500).optional().or(z.literal("")),
  jurisdiction: z.string().max(120).optional().or(z.literal("")),
  summary: z.string().max(4000).optional().or(z.literal("")),
});
