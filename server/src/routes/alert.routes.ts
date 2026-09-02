import { Router } from 'express';
import { getAlerts, getAlertsCount, dismissAlert } from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getAlerts);
router.get('/count', authenticate, getAlertsCount);
router.patch('/:id/dismiss', authenticate, dismissAlert);

export default router;
