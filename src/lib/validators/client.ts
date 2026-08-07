import { z } from "zod";

export const clientSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(200),
  clientType: z.enum(["INDIVIDUAL", "COMPANY", "GOVERNMENT", "NGO"]).default("INDIVIDUAL"),
  companyName: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(400).optional().or(z.literal("")),
  nationalId: z.string().max(60).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;
