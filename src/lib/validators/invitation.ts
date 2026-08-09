import { z } from "zod";

export const invitationSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["OWNER", "ADMIN", "ADVOCATE", "PARALEGAL", "STAFF", "RESEARCHER", "READ_ONLY"]),
});

export type InvitationInput = z.infer<typeof invitationSchema>;
