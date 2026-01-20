import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/UserService';

export class ProfileController {
    // GET /api/profile - Get current user's profile
    async getProfile(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const profile = await userService.getUserById(userId);
            res.json(profile);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/profile - Update current user's profile
    async updateProfile(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const updatedProfile = await userService.updateProfile(userId, req.body);
            res.json(updatedProfile);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // POST /api/profile/change-password - Change password
    async changePassword(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current password and new password are required' });
            }

            const result = await userService.changePassword(userId, currentPassword, newPassword);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export const profileController = new ProfileController();
