import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    startTime: z.string().datetime(),
    durationMin: z.number().int().positive('Duration must be positive'),
    location: z.string().min(1, 'Location is required'),
    capacity: z.number().int().positive('Capacity must be positive'),
  }),
});

export const updateSessionSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    startTime: z.string().datetime().optional(),
    durationMin: z.number().int().positive().optional(),
    location: z.string().min(1).optional(),
    capacity: z.number().int().positive().optional(),
  }),
});
