import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  venue: z.string().min(1).max(255),
  startDate: z.union([z.string().datetime(), z.coerce.date()]),
  endDate: z.union([z.string().datetime(), z.coerce.date()])
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "endDate must be greater than or equal to startDate",
  path: ["endDate"]
});

export const updateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  venue: z.string().min(1).max(255).optional(),
  startDate: z.union([z.string().datetime(), z.coerce.date()]).optional(),
  endDate: z.union([z.string().datetime(), z.coerce.date()]).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "endDate must be greater than or equal to startDate",
  path: ["endDate"]
});

export const archiveEventSchema = z.object({
  isArchived: z.boolean()
});
