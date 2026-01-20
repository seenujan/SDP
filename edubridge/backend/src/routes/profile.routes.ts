import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { profileController } from '../controllers/ProfileController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/', (req, res) => profileController.getProfile(req, res));
router.put('/', (req, res) => profileController.updateProfile(req, res));
router.post('/change-password', (req, res) => profileController.changePassword(req, res));

export default router;
