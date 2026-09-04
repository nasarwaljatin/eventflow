import { Router } from 'express';
import { getAdminStats, getAdminEvents, getPendingEvents, approveEvent, rejectEvent, getAdminUsers, updateUserRole } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN'), getAdminStats);
router.get('/events', authenticate, authorize('ADMIN'), getAdminEvents);
router.get('/events/pending', authenticate, authorize('ADMIN'), getPendingEvents);
router.patch('/events/:id/approve', authenticate, authorize('ADMIN'), approveEvent);
router.patch('/events/:id/reject', authenticate, authorize('ADMIN'), rejectEvent);
router.get('/users', authenticate, authorize('ADMIN'), getAdminUsers);
router.patch('/users/:id/role', authenticate, authorize('ADMIN'), updateUserRole);

export default router;
