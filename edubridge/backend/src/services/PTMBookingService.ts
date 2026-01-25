import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { notificationService } from './NotificationService';

export interface PTMMeeting {
    id?: number;
    student_id: number;
    teacher_id: number;
    parent_id: number;
    meeting_date: string;
    meeting_time: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'reschedule_requested';
    initiator: 'parent' | 'teacher';
    notes?: string;
    rejection_reason?: string;
    alternative_date?: string;
    alternative_time?: string;
    teacher_remarks?: string;
    created_at?: string;
    parent_name?: string;
    student_name?: string;
    grade?: string;
    section?: string;
    teacher_name?: string;
}

export class PTMBookingService {
    // Get all PTM requests for a teacher
    async getPTMRequestsByTeacher(teacherId: number, status?: string): Promise<PTMMeeting[]> {
        let query = `
            SELECT ptm.*, 
                pr.full_name as parent_name,
                s.full_name as student_name,
                c.grade,
                c.section,
                s.roll_number,
                u.email as parent_email,
                pr.phone as parent_phone
            FROM ptm_meetings ptm
            LEFT JOIN users p ON ptm.parent_id = p.id
            LEFT JOIN parents pr ON ptm.parent_id = pr.user_id
            JOIN students s ON ptm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON ptm.parent_id = u.id
            WHERE ptm.teacher_id = ?
        `;
        const params: any[] = [teacherId];

        if (status) {
            query += ' AND ptm.status = ?';
            params.push(status);
        }

        query += ' ORDER BY ptm.created_at DESC';

        console.log('PTM Teacher Query:', query);
        console.log('Params:', params);

        const [bookings] = await pool.query<RowDataPacket[]>(query, params);
        console.log(`Found ${bookings.length} PTMs for teacher ${teacherId}`);
        return bookings as PTMMeeting[];
    }

    // Get all PTM requests for a parent
    async getPTMRequestsByParent(parentId: number): Promise<PTMMeeting[]> {
        const query = `
            SELECT ptm.*, 
                t.full_name as teacher_name,
                s.full_name as student_name,
                c.grade,
                c.section
            FROM ptm_meetings ptm
            JOIN teachers t ON ptm.teacher_id = t.user_id
            JOIN students s ON ptm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE ptm.parent_id = ?
            ORDER BY ptm.created_at DESC
        `;
        const [bookings] = await pool.query<RowDataPacket[]>(query, [parentId]);
        console.log(`Found ${bookings.length} PTMs for parent ${parentId}`);
        return bookings as PTMMeeting[];
    }

    // Get PTM booking by ID
    async getPTMBookingById(bookingId: number): Promise<PTMMeeting> {
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT ptm.*, 
                pr.full_name as parent_name,
                s.full_name as student_name,
                t.full_name as teacher_name
            FROM ptm_meetings ptm
            LEFT JOIN parents pr ON ptm.parent_id = pr.user_id
            JOIN students s ON ptm.student_id = s.id
            LEFT JOIN teachers t ON ptm.teacher_id = t.user_id
            WHERE ptm.id = ?`,
            [bookingId]
        );
        return bookings[0] as PTMMeeting;
    }

    // Check if slot is available
    async checkAvailability(teacherId: number, date: string, time: string): Promise<boolean> {
        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM ptm_meetings 
             WHERE teacher_id = ? 
             AND meeting_date = ? 
             AND meeting_time = ? 
             AND (status = 'approved' OR status = 'pending')`,
            [teacherId, date, time]
        );
        return existing.length === 0;
    }

    // Get booked slots for a teacher on a specific date
    async getBookedSlots(teacherId: number, date: string): Promise<string[]> {
        const [slots] = await pool.query<RowDataPacket[]>(
            `SELECT meeting_time FROM ptm_meetings 
             WHERE teacher_id = ? 
             AND meeting_date = ? 
             AND (status = 'approved' OR status = 'pending')`,
            [teacherId, date]
        );
        return slots.map(s => s.meeting_time);
    }

    // Create PTM booking (Parent or Teacher initiated)
    async createPTMBooking(bookingData: PTMMeeting): Promise<PTMMeeting> {
        // Validate availability
        const isAvailable = await this.checkAvailability(
            bookingData.teacher_id,
            bookingData.meeting_date,
            bookingData.meeting_time
        );

        if (!isAvailable) {
            throw new Error('This time slot is already booked or pending approval.');
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO ptm_meetings 
            (parent_id, teacher_id, student_id, meeting_date, meeting_time, notes, status, initiator)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [
                bookingData.parent_id,
                bookingData.teacher_id,
                bookingData.student_id,
                bookingData.meeting_date,
                bookingData.meeting_time,
                bookingData.notes || null,
                bookingData.initiator
            ]
        );

        const bookingId = result.insertId;
        const newBooking = await this.getPTMBookingById(bookingId);

        // Notify the recipient
        if (bookingData.initiator === 'parent') {
            await notificationService.createNotification(
                bookingData.teacher_id,
                'New PTM Request',
                `You have a new PTM request from ${newBooking.parent_name} for ${newBooking.student_name} on ${bookingData.meeting_date} at ${bookingData.meeting_time}.`,
                'ptm'
            );
        } else {
            await notificationService.createNotification(
                bookingData.parent_id,
                'New PTM Invitation',
                `Teacher ${newBooking.teacher_name} has invited you for a PTM for ${newBooking.student_name} on ${bookingData.meeting_date} at ${bookingData.meeting_time}.`,
                'ptm'
            );
        }

        return newBooking;
    }

    // Update PTM status (approve)
    async approvePTM(bookingId: number): Promise<PTMMeeting> {
        // Double check availability before approving
        const booking = await this.getPTMBookingById(bookingId);
        if (!booking) throw new Error("Booking not found");

        const isAvailable = await this.checkAvailability(
            booking.teacher_id,
            booking.meeting_date,
            booking.meeting_time
        );

        // Note: The checkAvailability will return false because THIS booking is 'pending'.
        // We need to check if there are OTHER approved bookings.
        const [conflicts] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM ptm_meetings 
             WHERE teacher_id = ? 
             AND meeting_date = ? 
             AND meeting_time = ? 
             AND status = 'approved'
             AND id != ?`,
            [booking.teacher_id, booking.meeting_date, booking.meeting_time, bookingId]
        );

        if (conflicts.length > 0) {
            throw new Error('This slot has already been approved for another request.');
        }

        await pool.query(
            `UPDATE ptm_meetings SET status = 'approved' WHERE id = ?`,
            [bookingId]
        );

        // Notify the other party
        if (booking.initiator === 'parent') {
            // Teacher approved parent's request
            await notificationService.createNotification(
                booking.parent_id,
                'PTM Request Approved',
                `Your PTM request with ${booking.teacher_name} for ${booking.student_name} has been approved.`,
                'ptm'
            );
        } else {
            // Parent approved teacher's request
            await notificationService.createNotification(
                booking.teacher_id,
                'PTM Invitation Accepted',
                `${booking.parent_name} has accepted your PTM invitation for ${booking.student_name}.`,
                'ptm'
            );
        }

        return this.getPTMBookingById(bookingId);
    }

    // Reject PTM and propose alternative
    async rejectWithAlternative(
        bookingId: number,
        reason: string,
        alternativeDate: string,
        alternativeTime: string
    ): Promise<PTMMeeting> {
        await pool.query(
            `UPDATE ptm_meetings 
            SET status = 'reschedule_requested', 
                rejection_reason = ?, 
                alternative_date = ?, 
                alternative_time = ?
            WHERE id = ?`,
            [reason, alternativeDate, alternativeTime, bookingId]
        );

        const booking = await this.getPTMBookingById(bookingId);

        // Notify Parent (assuming teacher reschedules)
        await notificationService.createNotification(
            booking.parent_id,
            'PTM Reschedule Requested',
            `Your PTM request with ${booking.teacher_name} was declined. Alternative proposed: ${alternativeDate} at ${alternativeTime}. Reason: ${reason}`,
            'ptm'
        );

        return booking;
    }

    // Accept alternative slot (by Parent)
    async acceptAlternative(bookingId: number): Promise<PTMMeeting> {
        // We move the alternative date/time to the main meeting date/time and approve it
        const booking = await this.getPTMBookingById(bookingId);
        if (!booking.alternative_date || !booking.alternative_time) {
            throw new Error("No alternative slot to accept");
        }

        await pool.query(
            `UPDATE ptm_meetings 
            SET status = 'approved',
            meeting_date = ?,
            meeting_time = ?,
            alternative_date = NULL,
            alternative_time = NULL,
            rejection_reason = NULL
            WHERE id = ?`,
            [booking.alternative_date, booking.alternative_time, bookingId]
        );

        // Notify Teacher
        await notificationService.createNotification(
            booking.teacher_id,
            'Alternative Slot Accepted',
            `${booking.parent_name} has accepted the alternative slot for ${booking.student_name} on ${booking.alternative_date} at ${booking.alternative_time}.`,
            'ptm'
        );

        return this.getPTMBookingById(bookingId);
    }

    // Just reject without alternative (or final rejection)
    async rejectPTM(bookingId: number, reason: string): Promise<PTMMeeting> {
        await pool.query(
            `UPDATE ptm_meetings SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
            [reason, bookingId]
        );

        const booking = await this.getPTMBookingById(bookingId);
        const recipientId = booking.initiator === 'parent' ? booking.parent_id : booking.teacher_id;
        // Correcting access logic as before I might have used recipientName which I might not need 
        // Logic: if parent initiated, tell parent. If teacher initiated, tell teacher.
        // Wait, if teacher rejects a parent request, tell parent.
        // If parent rejects a teacher request, tell teacher.

        await notificationService.createNotification(
            recipientId,
            'PTM Request Rejected',
            `The PTM request for ${booking.student_name} was rejected. Reason: ${reason}`,
            'ptm'
        );

        return booking;
    }

    // Mark PTM as completed
    async completePTM(bookingId: number, teacherRemarks?: string): Promise<PTMMeeting> {
        await pool.query(
            'UPDATE ptm_meetings SET status = ?, teacher_remarks = ? WHERE id = ?',
            ['completed', teacherRemarks || null, bookingId]
        );

        const booking = await this.getPTMBookingById(bookingId);

        await notificationService.createNotification(
            booking.parent_id,
            'PTM Completed',
            `The PTM with ${booking.teacher_name} has been marked as completed. Remarks: ${teacherRemarks || 'None'}`,
            'ptm'
        );

        return booking;
    }

    // Get upcoming PTMs for teacher
    async getUpcomingPTMs(teacherId: number): Promise<PTMMeeting[]> {
        const [bookings] = await pool.query<RowDataPacket[]>(
            `SELECT ptm.*, 
                pr.full_name as parent_name,
                s.full_name as student_name,
                c.grade,
                c.section
            FROM ptm_meetings ptm
            LEFT JOIN parents pr ON ptm.parent_id = pr.user_id
            JOIN students s ON ptm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE ptm.teacher_id = ? 
            AND ptm.status = 'approved'
            AND ptm.meeting_date >= CURDATE()
            ORDER BY ptm.meeting_date, ptm.meeting_time`,
            [teacherId]
        );
        return bookings as PTMMeeting[];
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
            FROM ptm_meetings
            WHERE teacher_id = ?`,
            [teacherId]
        );
        return stats[0];
    }

    // Delete PTM booking (optional, mostly for cleanup)
    async deletePTMBooking(bookingId: number): Promise<void> {
        await pool.query('DELETE FROM ptm_meetings WHERE id = ?', [bookingId]);
    }
}

export const ptmBookingService = new PTMBookingService();
