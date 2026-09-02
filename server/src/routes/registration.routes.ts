import { Router } from 'express';
import { 
  confirmRegistration, 
  checkInRegistration, 
  cancelRegistration, 
  findRegistrations,
  addStaffNote,
  getTimeline
} from '../controllers/registration.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { canAccessSession } from '../middleware/sessionAccess.js';

const router = Router();

router.get('/', authenticate, findRegistrations);

// /api/registrations/:id/*
router.patch('/:id/confirm', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, confirmRegistration);
router.patch('/:id/check-in', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, checkInRegistration);
router.patch('/:id/cancel', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, cancelRegistration);
router.post('/:id/notes', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, addStaffNote);
router.get('/:id/timeline', authenticate, authorize('ORGANIZER', 'CHECK_IN_STAFF'), canAccessSession, getTimeline);

export default router;
