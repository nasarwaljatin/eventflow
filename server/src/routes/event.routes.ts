import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent, toggleArchive } from '../controllers/event.controller.js';
import { validate } from '../middleware/validate.js';
import { createEventSchema, updateEventSchema } from '../schemas/event.schema.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('ORGANIZER'), validate(createEventSchema), createEvent);
router.get('/', authenticate, getEvents);
router.get('/:id', authenticate, getEventById);
router.patch('/:id', authenticate, authorize('ORGANIZER'), validate(updateEventSchema), updateEvent);
router.patch('/:id/archive', authenticate, authorize('ORGANIZER'), toggleArchive);

export default router;
