import { pool } from '../config/database';

export class TimetableService {
    // Get all timetable entries
    async getAllTimetable() {
        const [rows] = await pool.query(`
            SELECT 
                t.id, t.class_id, t.subject, t.day_of_week, t.start_time, t.end_time, t.teacher_id,
                c.grade, c.section,
                CONCAT(c.grade, ' ', c.section) as class_name,
                te.full_name as teacher_name
            FROM timetable t
            JOIN classes c ON t.class_id = c.id
            LEFT JOIN teachers te ON t.teacher_id = te.user_id
            ORDER BY CAST(SUBSTRING(c.grade, 7) AS UNSIGNED), c.section, 
                FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
                t.start_time
        `);
        return rows;
    }

    // Get timetable by class
    async getTimetableByClass(classId: number) {
        const [rows] = await pool.query(`
            SELECT 
                t.id, t.class_id, t.subject, t.day_of_week, t.start_time, t.end_time, t.teacher_id,
                c.grade, c.section,
                te.full_name as teacher_name
            FROM timetable t
            JOIN classes c ON t.class_id = c.id
            LEFT JOIN teachers te ON t.teacher_id = te.user_id
            WHERE t.class_id = ?
            ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), t.start_time
        `, [classId]);
        return rows;
    }

    // Get timetable by teacher
    async getTimetableByTeacher(teacherId: number) {
        const [rows] = await pool.query(`
            SELECT 
                t.id, t.class_id, t.subject, t.day_of_week, t.start_time, t.end_time, t.teacher_id,
                c.grade, c.section,
                CONCAT(c.grade, ' ', c.section) as class_name
            FROM timetable t
            JOIN classes c ON t.class_id = c.id
            WHERE t.teacher_id = ?
            ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), t.start_time
        `, [teacherId]);
        return rows;
    }

    // Get timetable entry by ID
    async getTimetableById(id: number) {
        const [rows]: any = await pool.query(`
            SELECT 
                t.id, t.class_id, t.subject, t.day_of_week, t.start_time, t.end_time, t.teacher_id,
                c.grade, c.section,
                te.full_name as teacher_name
            FROM timetable t
            JOIN classes c ON t.class_id = c.id
            LEFT JOIN teachers te ON t.teacher_id = te.user_id
            WHERE t.id = ?
        `, [id]);
        return rows[0] || null;
    }

    // Create timetable entry
    async createTimetable(data: {
        classId: number;
        subject: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        teacherId: number;
    }) {
        // Check for conflicts (same class, same day, overlapping time)
        const [conflicts]: any = await pool.query(`
            SELECT id FROM timetable 
            WHERE class_id = ? AND day_of_week = ?
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `, [
            data.classId, data.dayOfWeek,
            data.startTime, data.startTime,
            data.endTime, data.endTime,
            data.startTime, data.endTime
        ]);

        if (conflicts.length > 0) {
            throw new Error('Time slot conflict: This class already has a session at this time.');
        }

        // Check teacher availability
        const [teacherConflicts]: any = await pool.query(`
            SELECT id FROM timetable 
            WHERE teacher_id = ? AND day_of_week = ?
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `, [
            data.teacherId, data.dayOfWeek,
            data.startTime, data.startTime,
            data.endTime, data.endTime,
            data.startTime, data.endTime
        ]);

        if (teacherConflicts.length > 0) {
            throw new Error('Teacher conflict: This teacher is already assigned to another class at this time.');
        }

        const [result]: any = await pool.query(
            'INSERT INTO timetable (class_id, subject, day_of_week, start_time, end_time, teacher_id) VALUES (?, ?, ?, ?, ?, ?)',
            [data.classId, data.subject, data.dayOfWeek, data.startTime, data.endTime, data.teacherId]
        );

        return { id: result.insertId, ...data };
    }

    // Update timetable entry
    async updateTimetable(id: number, data: {
        classId?: number;
        subject?: string;
        dayOfWeek?: string;
        startTime?: string;
        endTime?: string;
        teacherId?: number;
    }) {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.classId) { updates.push('class_id = ?'); values.push(data.classId); }
        if (data.subject) { updates.push('subject = ?'); values.push(data.subject); }
        if (data.dayOfWeek) { updates.push('day_of_week = ?'); values.push(data.dayOfWeek); }
        if (data.startTime) { updates.push('start_time = ?'); values.push(data.startTime); }
        if (data.endTime) { updates.push('end_time = ?'); values.push(data.endTime); }
        if (data.teacherId) { updates.push('teacher_id = ?'); values.push(data.teacherId); }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        await pool.query(`UPDATE timetable SET ${updates.join(', ')} WHERE id = ?`, values);

        return await this.getTimetableById(id);
    }

    // Delete timetable entry
    async deleteTimetable(id: number) {
        await pool.query('DELETE FROM timetable WHERE id = ?', [id]);
        return { success: true, message: 'Timetable entry deleted successfully' };
    }

    // Get teachers for dropdown
    async getTeachersForDropdown() {
        const [rows] = await pool.query(`
            SELECT t.user_id as id, t.full_name, t.subject
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.full_name
        `);
        return rows;
    }
}

export const timetableService = new TimetableService();
