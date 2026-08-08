import { z } from "zod";

export const recordingCreateSchema = z.object({
  storagePath: z.string().min(1),
  mimeType: z.string().min(1),
  durationSeconds: z.number().int().nonnegative().optional(),
});
