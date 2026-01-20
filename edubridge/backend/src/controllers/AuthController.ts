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

            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
}

export const authController = new AuthController();
