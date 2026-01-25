import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';

export const notificationController = {
    async getMyNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            const notifications = await notificationService.getUserNotifications(userId, limit);
            const unreadCount = await notificationService.getUnreadCount(userId);

            res.json({ notifications, unreadCount });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    },

    async markAsRead(req: Request, res: Response) {
        try {
            const notificationId = parseInt(req.params.id);
            await notificationService.markAsRead(notificationId);
            res.json({ message: 'Marked as read' });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({ error: 'Failed to update notification' });
        }
    },

    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            await notificationService.markAllAsRead(userId);
            res.json({ message: 'All marked as read' });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({ error: 'Failed to update notifications' });
        }
    }
};
