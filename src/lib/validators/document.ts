import { z } from "zod";

export const DOCUMENT_CATEGORIES = [
  "CONTRACT",
  "COURT_FILING",
  "EVIDENCE",
  "CORRESPONDENCE",
  "INVOICE",
  "ID_DOCUMENT",
  "AFFIDAVIT",
  "OTHER",
] as const;

export const documentMetaSchema = z.object({
  fileName: z.string().min(1).max(300),
  storagePath: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  category: z.enum(DOCUMENT_CATEGORIES).default("OTHER"),
  clientId: z.string().uuid().optional().or(z.literal("")),
  caseId: z.string().uuid().optional().or(z.literal("")),
});

export const documentFolderSchema = z.object({
  label: z.string().min(1).max(120),
  path: z.string().min(1).max(500),
});
