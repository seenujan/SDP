import { Router } from 'express';
import { authController } from '../controllers/AuthController';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => authController.login(req, res));
// POST /api/auth/activate
router.post('/activate', (req, res) => authController.activateAccount(req, res));
// GET /api/auth/verify-token
router.get('/verify-token', (req, res) => authController.verifyToken(req, res));

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => authController.requestPasswordReset(req, res));
// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

export default router;
