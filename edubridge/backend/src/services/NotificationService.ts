import { pool as db } from '../config/database';

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: 'ptm' | 'system' | 'assignment' | 'exam';
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    async createNotification(userId: number, title: string, message: string, type: string = 'system') {
        const query = `
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, ?)
        `;
        await db.query(query, [userId, title, message, type]);
    },

    async getUserNotifications(userId: number, limit: number = 20) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const [rows] = await db.query(query, [userId, limit]);
        return rows as Notification[];
    },

    async getUnreadCount(userId: number) {
        const query = `
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND is_read = FALSE
        `;
        const [rows]: any = await db.query(query, [userId]);
        return rows[0].count;
    },

    async markAsRead(notificationId: number) {
        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = ?
        `;
        await db.query(query, [notificationId]);
    },

    async markAllAsRead(userId: number) {
        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE user_id = ?
        `;
        await db.query(query, [userId]);
    }
};
