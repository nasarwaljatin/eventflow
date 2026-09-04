import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(['ORGANIZER', 'CHECK_IN_STAFF'])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1),
  role: z.enum(['ORGANIZER', 'CHECK_IN_STAFF']).optional()
});
