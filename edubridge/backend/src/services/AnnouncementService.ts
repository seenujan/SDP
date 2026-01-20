import { pool } from '../config/database';

export class AnnouncementService {
    // Create announcement
    async createAnnouncement(data: {
        title: string;
        message: string;
        postedBy: number;
    }) {
        const [result]: any = await pool.query(
            'INSERT INTO announcements (title, message, posted_by) VALUES (?, ?, ?)',
            [data.title, data.message, data.postedBy]
        );

        return { id: result.insertId, ...data };
    }

    // Get all announcements
    async getAllAnnouncements() {
        const [rows] = await pool.query(
            `SELECT 
        a.*,
        COALESCE(t.full_name, 'Admin') as posted_by_name
      FROM announcements a
      LEFT JOIN teachers t ON a.posted_by = t.user_id
      ORDER BY a.posted_at DESC`
        );

        return rows;
    }

    // Update announcement
    async updateAnnouncement(id: number, data: {
        title: string;
        message: string;
    }) {
        await pool.query(
            'UPDATE announcements SET title = ?, message = ? WHERE id = ?',
            [data.title, data.message, id]
        );

        return { id, ...data };
    }

    // Delete announcement
    async deleteAnnouncement(id: number) {
        await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
        return { success: true };
    }
}

export class EventService {
    // Create event
    async createEvent(data: {
        title: string;
        description: string;
        eventDate: string;
        createdBy: number;
    }) {
        const [result]: any = await pool.query(
            'INSERT INTO events (title, description, event_date, created_by) VALUES (?, ?, ?, ?)',
            [data.title, data.description, data.eventDate, data.createdBy]
        );

        return { id: result.insertId, ...data };
    }

    // Get all events
    async getAllEvents() {
        const [rows] = await pool.query(
            `SELECT 
        e.*,
        COALESCE(t.full_name, 'Admin') as created_by_name
      FROM events e
      LEFT JOIN teachers t ON e.created_by = t.user_id
      ORDER BY e.event_date ASC`
        );

        return rows;
    }

    // Get upcoming events
    async getUpcomingEvents() {
        const [rows] = await pool.query(
            `SELECT 
        e.*,
        COALESCE(t.full_name, 'Admin') as created_by_name
      FROM events e
      LEFT JOIN teachers t ON e.created_by = t.user_id
      WHERE e.event_date >= CURDATE()
      ORDER BY e.event_date ASC
      LIMIT 10`
        );

        return rows;
    }

    // Update event
    async updateEvent(id: number, data: {
        title: string;
        description: string;
        eventDate: string;
    }) {
        await pool.query(
            'UPDATE events SET title = ?, description = ?, event_date = ? WHERE id = ?',
            [data.title, data.description, data.eventDate, id]
        );

        return { id, ...data };
    }

    // Delete event
    async deleteEvent(id: number) {
        await pool.query('DELETE FROM events WHERE id = ?', [id]);
        return { success: true };
    }
}

export const announcementService = new AnnouncementService();
export const eventService = new EventService();
