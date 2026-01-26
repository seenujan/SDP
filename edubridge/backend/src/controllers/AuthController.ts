import { Request, Response } from 'express';
import { authService } from '../services/AuthService';

export class AuthController {
    // POST /api/auth/login
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await authService.login(email, password);

            // Check active status (handle number 1/0, boolean true/false, and Buffer)
            let isActive = result.user.active;
            if (Buffer.isBuffer(isActive)) {
                isActive = isActive[0] === 1;
            }

            if (isActive !== 1 && isActive !== true) {
                return res.status(403).json({ error: 'Your account is deactivated. Please contact administrator.' });
            }

            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    // POST /api/auth/activate
    async activateAccount(req: Request, res: Response) {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                return res.status(400).json({ error: 'Token and password are required' });
            }

            const result = await authService.activateAccount(token, password);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/auth/verify-token
    async verifyToken(req: Request, res: Response) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }
            const result = await authService.verifyToken(token as string);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // POST /api/auth/forgot-password
    async requestPasswordReset(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            const result = await authService.requestPasswordReset(email);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // POST /api/auth/reset-password
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                return res.status(400).json({ error: 'Token and password are required' });
            }
            const result = await authService.resetPassword(token, password);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const authController = new AuthController();
