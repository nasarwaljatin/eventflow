import { Router } from 'express';
import multer from 'multer';
import { createSession, getSessionsByEvent, getSessionById, updateSession, deleteSession, assignStaff, removeStaff, listStaff } from '../controllers/session.controller.js';
import { validate } from '../middleware/validate.js';
import { createSessionSchema, updateSessionSchema } from '../schemas/session.schema.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createRegistration, exportRegistrationsCSV, importRegistrations } from '../controllers/registration.controller.js';
import { createRegistrationSchema } from '../schemas/registration.schema.js';
import { canAccessSession } from '../middleware/sessionAccess.js';

const upload = multer({ storage: multer.memoryStorage() });

// This router handles /api/events/:eventId/sessions
export const eventSessionRouter = Router({ mergeParams: true });
eventSessionRouter.get('/', authenticate, getSessionsByEvent);
eventSessionRouter.post('/', authenticate, authorize('ORGANIZER'), validate(createSessionSchema), createSession);

// This router handles /api/sessions
export const sessionRouter = Router();
sessionRouter.get('/:id', authenticate, getSessionById);
sessionRouter.patch('/:id', authenticate, authorize('ORGANIZER'), validate(updateSessionSchema), updateSession);
sessionRouter.delete('/:id', authenticate, authorize('ORGANIZER'), deleteSession);

// Staff for a session
sessionRouter.post('/:id/staff', authenticate, authorize('ORGANIZER'), assignStaff);
sessionRouter.delete('/:id/staff/:userId', authenticate, authorize('ORGANIZER'), removeStaff);
sessionRouter.get('/:id/staff', authenticate, authorize('ORGANIZER'), listStaff);

// Registrations for a session
sessionRouter.get('/:id/registrations/export', authenticate, canAccessSession, exportRegistrationsCSV);
sessionRouter.post('/:id/registrations/import', authenticate, canAccessSession, upload.single('file'), importRegistrations);
sessionRouter.post('/:id/registrations', authenticate, validate(createRegistrationSchema), createRegistration);
