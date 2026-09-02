import { z } from 'zod';

export const createRegistrationSchema = z.object({
  body: z.object({
    attendeeName: z.string().min(1, 'Attendee name is required'),
    attendeeEmail: z.string().email('Invalid email address'),
  }),
});
