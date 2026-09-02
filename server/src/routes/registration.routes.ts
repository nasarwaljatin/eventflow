import { Router } from 'express';
import { confirmRegistration, checkInRegistration, cancelRegistration } from '../controllers/registration.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// /api/registrations/:id/*
router.patch('/:id/confirm', authenticate, authorize('ORGANIZER'), confirmRegistration);
router.patch('/:id/check-in', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), checkInRegistration);
router.patch('/:id/cancel', authenticate, authorize('ORGANIZER'), cancelRegistration);

export default router;
