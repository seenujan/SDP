import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any); // Protected routes

router.get('/', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

export default router;
