import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface PTMBooking {
    id?: number;
    parent_id: number;
    teacher_id: number;
    student_id: number;
    preferred_date: string;
    preferred_time: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    approved_date?: string;
    approved_time?: string;
    teacher_remarks?: string;
    created_at?: string;
}

export class PTMBookingService {
    // Get all PTM requests for a teacher
    async getPTMRequestsByTeacher(teacherId: number, status?: string): Promise<any[]> {
        let query = `
            SELECT ptm.*, 
                p.full_name as parent_name,
                s.full_name as student_name,
                s.grade,
                s.section,
                s.roll_number,
                u.email as parent_email,
                u.phone as parent_phone
            FROM ptm_bookings ptm
            JOIN parents p ON ptm.parent_id = p.id
            JOIN students s ON ptm.student_id = s.id
            JOIN users u ON p.user_id = u.id
            WHERE ptm.teacher_id = ?
        `;
        const params: any[] = [teacherId];

        if (status) {
            query += ' AND ptm.status = ?';
            params.push(status);
        }

        query += ' ORDER BY ptm.created_at DESC';

        const [bookings] = await pool.query<RowDataPacket[]>(query, params);
        return bookings;
    }

    // Get PTM booking by ID
    async getPTMBookingById(bookingId: number): Promise<any> {
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT ptm.*, 
                p.full_name as parent_name,
                s.full_name as student_name,
                s.grade,
                s.section,
                u.email as parent_email,
                u.phone as parent_phone
            FROM ptm_bookings ptm
            JOIN parents p ON ptm.parent_id = p.id
            JOIN students s ON ptm.student_id = s.id
            JOIN users u ON p.user_id = u.id
            WHERE ptm.id = ?`,
            [bookingId]
        );
        return bookings[0];
    }

    // Update PTM status (approve/reject)
    async updatePTMStatus(
        bookingId: number,
        status: 'approved' | 'rejected',
        approvedDate?: string,
        approvedTime?: string,
        teacherRemarks?: string
    ): Promise<any> {
        await pool.query(
            `UPDATE ptm_bookings 
            SET status = ?, approved_date = ?, approved_time = ?, teacher_remarks = ?
            WHERE id = ?`,
            [status, approvedDate || null, approvedTime || null, teacherRemarks || null, bookingId]
        );

        return this.getPTMBookingById(bookingId);
    }

    // Mark PTM as completed
    async completePTM(bookingId: number, teacherRemarks?: string): Promise<any> {
        await pool.query(
            'UPDATE ptm_bookings SET status = ?, teacher_remarks = ? WHERE id = ?',
            ['completed', teacherRemarks || null, bookingId]
        );

        return this.getPTMBookingById(bookingId);
    }

    // Get upcoming PTMs for teacher
    async getUpcomingPTMs(teacherId: number): Promise<any[]> {
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT ptm.*, 
                p.full_name as parent_name,
                s.full_name as student_name,
                s.grade,
                s.section
            FROM ptm_bookings ptm
            JOIN parents p ON ptm.parent_id = p.id
            JOIN students s ON ptm.student_id = s.id
            WHERE ptm.teacher_id = ? 
            AND ptm.status = 'approved'
            AND ptm.approved_date >= CURDATE()
            ORDER BY ptm.approved_date, ptm.approved_time`,
            [teacherId]
        );
        return bookings;
    }

    // Get PTM statistics for teacher
    async getPTMStats(teacherId: number): Promise<any> {
        const [stats] = await pool.query<RowDataPacket[]>(
            `SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM ptm_bookings
            WHERE teacher_id = ?`,
            [teacherId]
        );
        return stats[0];
    }

    // Create PTM booking (for parent)
    async createPTMBooking(bookingData: PTMBooking): Promise<any> {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO ptm_bookings 
            (parent_id, teacher_id, student_id, preferred_date, preferred_time, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [
                bookingData.parent_id,
                bookingData.teacher_id,
                bookingData.student_id,
                bookingData.preferred_date,
                bookingData.preferred_time,
                bookingData.reason || null,
            ]
        );

        return this.getPTMBookingById(result.insertId);
    }

    // Delete PTM booking
    async deletePTMBooking(bookingId: number): Promise<void> {
        await pool.query('DELETE FROM ptm_bookings WHERE id = ?', [bookingId]);
    }
}

export const ptmBookingService = new PTMBookingService();
