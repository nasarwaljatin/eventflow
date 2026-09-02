import { Router } from 'express';
import { createSession, getSessionsByEvent, getSessionById, updateSession, deleteSession } from '../controllers/session.controller.js';
import { validate } from '../middleware/validate.js';
import { createSessionSchema, updateSessionSchema } from '../schemas/session.schema.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createRegistration } from '../controllers/registration.controller.js';
import { createRegistrationSchema } from '../schemas/registration.schema.js';

// This router handles /api/events/:eventId/sessions
export const eventSessionRouter = Router({ mergeParams: true });
eventSessionRouter.get('/', authenticate, getSessionsByEvent);
eventSessionRouter.post('/', authenticate, authorize('ORGANIZER'), validate(createSessionSchema), createSession);

// This router handles /api/sessions
export const sessionRouter = Router();
sessionRouter.get('/:id', authenticate, getSessionById);
sessionRouter.patch('/:id', authenticate, authorize('ORGANIZER'), validate(updateSessionSchema), updateSession);
sessionRouter.delete('/:id', authenticate, authorize('ORGANIZER'), deleteSession);

// Registrations for a session
sessionRouter.post('/:id/registrations', authenticate, validate(createRegistrationSchema), createRegistration);
