import { z } from 'zod';
export const ScanRequestSchema = z.object({
  companyName: z.string().min(2),
  workEmail: z.string().email(),
  companyDomain: z.string().min(3),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  turnstileToken: z.string().min(10),
});
export type ScanRequest = z.infer<typeof ScanRequestSchema>;