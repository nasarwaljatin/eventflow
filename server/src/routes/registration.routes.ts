import { Router } from 'express';
import { confirmRegistration, checkInRegistration, cancelRegistration, findRegistrations } from '../controllers/registration.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { canAccessSession } from '../middleware/sessionAccess.js';

const router = Router();

router.get('/', authenticate, findRegistrations);

// /api/registrations/:id/*
router.patch('/:id/confirm', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, confirmRegistration);
router.patch('/:id/check-in', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, checkInRegistration);
router.patch('/:id/cancel', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, cancelRegistration);

export default router;
