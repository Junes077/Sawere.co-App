import { z } from "zod";

export const documentTemplateSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(80),
  bodyMarkdown: z.string().min(1).max(20000),
});

export const generateDraftSchema = z.object({
  templateId: z.string().uuid(),
  instructions: z.string().min(1).max(4000),
  clientId: z.string().uuid().optional().or(z.literal("")),
  caseId: z.string().uuid().optional().or(z.literal("")),
});
