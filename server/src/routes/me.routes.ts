import { Router } from 'express';
import { getMySessions } from '../controllers/me.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/sessions', authenticate, authorize('CHECK_IN_STAFF'), getMySessions);

export default router;
