import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/UserService';
import { pool } from '../config/database';
import path from 'path';
import fs from 'fs';

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

    // POST /api/profile/upload-photo - Upload profile photo
    async uploadProfilePhoto(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const file = (req as any).file;

            if (!file) {
                return res.status(400).json({ error: 'No photo uploaded' });
            }

            const photoUrl = `uploads/profiles/${file.filename}`;

            // Delete old profile photo if it exists
            const [rows]: any = await pool.query('SELECT profile_photo FROM users WHERE id = ?', [userId]);
            if (rows.length > 0 && rows[0].profile_photo) {
                const oldPath = path.join(__dirname, '../../', rows[0].profile_photo);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
                }
            }

            // Save new photo URL to users table
            await pool.query('UPDATE users SET profile_photo = ? WHERE id = ?', [photoUrl, userId]);

            res.json({ success: true, photoUrl, message: 'Profile photo updated successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const profileController = new ProfileController();
