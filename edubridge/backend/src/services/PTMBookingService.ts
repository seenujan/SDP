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
    teacher_remarks?: string; // kept for backward compat (legacy column)
    teacher_feedback?: string; // from ptm_feedback table
    parent_feedback?: string;  // from ptm_feedback table
    teacher_feedback_rating?: number;
    parent_feedback_rating?: number;
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
                pr.phone as parent_phone,
                tf.feedback as teacher_feedback,
                tf.rating as teacher_feedback_rating,
                pf.feedback as parent_feedback,
                pf.rating as parent_feedback_rating
            FROM ptm_meetings ptm
            LEFT JOIN users p ON ptm.parent_id = p.id
            LEFT JOIN parents pr ON ptm.parent_id = pr.user_id
            JOIN students s ON ptm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON ptm.parent_id = u.id
            LEFT JOIN ptm_feedback tf ON ptm.id = tf.ptm_meeting_id AND tf.feedback_from = 'teacher'
            LEFT JOIN ptm_feedback pf ON ptm.id = pf.ptm_meeting_id AND pf.feedback_from = 'parent'
            WHERE ptm.teacher_id = ?
        `;
        const params: any[] = [teacherId];

        if (status) {
            query += ' AND ptm.status = ?';
            params.push(status);
        }

        query += ' ORDER BY ptm.created_at DESC';

        const [bookings] = await pool.query<RowDataPacket[]>(query, params);
        return bookings as PTMMeeting[];
    }

    // Get all PTM requests for a parent
    async getPTMRequestsByParent(parentId: number): Promise<PTMMeeting[]> {
        const query = `
            SELECT ptm.*, 
                t.full_name as teacher_name,
                s.full_name as student_name,
                c.grade,
                c.section,
                tf.feedback as teacher_feedback,
                tf.rating as teacher_feedback_rating,
                pf.feedback as parent_feedback,
                pf.rating as parent_feedback_rating
            FROM ptm_meetings ptm
            JOIN teachers t ON ptm.teacher_id = t.user_id
            JOIN students s ON ptm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN ptm_feedback tf ON ptm.id = tf.ptm_meeting_id AND tf.feedback_from = 'teacher'
            LEFT JOIN ptm_feedback pf ON ptm.id = pf.ptm_meeting_id AND pf.feedback_from = 'parent'
            WHERE ptm.parent_id = ?
            ORDER BY ptm.created_at DESC
        `;
        const [bookings] = await pool.query<RowDataPacket[]>(query, [parentId]);
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

        // Notify the OTHER party — whoever proposed the reschedule notifies the other side
        // If parent initiated → teacher rejected & proposed alt → notify parent
        // If teacher initiated → parent rejected & proposed alt → notify teacher
        const rescheduleRecipientId = booking.initiator === 'parent'
            ? booking.parent_id
            : booking.teacher_id;
        const rescheduleMsg = booking.initiator === 'parent'
            ? `Your PTM request with ${booking.teacher_name} was declined. Alternative proposed: ${alternativeDate} at ${alternativeTime}. Reason: ${reason}`
            : `The parent has declined your PTM invitation for ${booking.student_name} and proposed an alternative: ${alternativeDate} at ${alternativeTime}. Reason: ${reason}`;

        await notificationService.createNotification(
            rescheduleRecipientId,
            'PTM Reschedule Proposed',
            rescheduleMsg,
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

        // Notify whoever PROPOSED the alternative (the accepting party's notification goes to the proposer)
        // Parent initiated → teacher proposed alt → parent accepted → notify teacher
        // Teacher initiated → parent proposed alt → teacher accepted → notify parent
        const acceptRecipientId = booking.initiator === 'parent'
            ? booking.teacher_id
            : booking.parent_id;
        const acceptMsg = booking.initiator === 'parent'
            ? `${booking.parent_name} has accepted your proposed alternative slot for ${booking.student_name} on ${booking.alternative_date} at ${booking.alternative_time}.`
            : `The teacher has accepted your proposed alternative slot for ${booking.student_name} on ${booking.alternative_date} at ${booking.alternative_time}.`;

        await notificationService.createNotification(
            acceptRecipientId,
            'Alternative Slot Accepted',
            acceptMsg,
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

    // Mark PTM as completed and save teacher feedback to ptm_feedback table
    async completePTM(bookingId: number, teacherRemarks?: string): Promise<PTMMeeting> {
        // Update status only (teacher_remarks column kept for legacy, but feedback goes to ptm_feedback)
        await pool.query(
            'UPDATE ptm_meetings SET status = ? WHERE id = ?',
            ['completed', bookingId]
        );

        const booking = await this.getPTMBookingById(bookingId);

        // Save teacher remarks as feedback in ptm_feedback table
        if (teacherRemarks && teacherRemarks.trim()) {
            const [existing] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM ptm_feedback WHERE ptm_meeting_id = ? AND feedback_from = ?',
                [bookingId, 'teacher']
            );
            if (existing.length > 0) {
                await pool.query(
                    'UPDATE ptm_feedback SET feedback = ?, created_at = CURRENT_TIMESTAMP WHERE ptm_meeting_id = ? AND feedback_from = ?',
                    [teacherRemarks.trim(), bookingId, 'teacher']
                );
            } else {
                await pool.query<ResultSetHeader>(
                    'INSERT INTO ptm_feedback (ptm_meeting_id, feedback_from, feedback) VALUES (?, ?, ?)',
                    [bookingId, 'teacher', teacherRemarks.trim()]
                );
            }
        }

        await notificationService.createNotification(
            booking.parent_id,
            'PTM Completed',
            `The PTM with ${booking.teacher_name} has been marked as completed.${
                teacherRemarks ? ` Teacher\'s feedback: ${teacherRemarks}` : ''
            }`,
            'ptm'
        );

        return this.getPTMBookingById(bookingId);
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

    // Submit feedback for a completed PTM meeting
    async submitFeedback(bookingId: number, feedbackFrom: 'parent' | 'teacher', feedback: string, rating?: number): Promise<any> {
        const booking = await this.getPTMBookingById(bookingId);
        if (!booking) throw new Error('Meeting not found');
        if (booking.status !== 'completed') throw new Error('Feedback can only be submitted for completed meetings');

        // Upsert: update if already submitted, otherwise insert
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM ptm_feedback WHERE ptm_meeting_id = ? AND feedback_from = ?',
            [bookingId, feedbackFrom]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE ptm_feedback SET feedback = ?, rating = ?, created_at = CURRENT_TIMESTAMP WHERE ptm_meeting_id = ? AND feedback_from = ?',
                [feedback, rating || null, bookingId, feedbackFrom]
            );
        } else {
            await pool.query<ResultSetHeader>(
                'INSERT INTO ptm_feedback (ptm_meeting_id, feedback_from, feedback, rating) VALUES (?, ?, ?, ?)',
                [bookingId, feedbackFrom, feedback, rating || null]
            );
        }

        // Notify the other party
        const notifyId = feedbackFrom === 'parent' ? booking.teacher_id : booking.parent_id;
        const notifyName = feedbackFrom === 'parent' ? booking.parent_name : booking.teacher_name;
        await notificationService.createNotification(
            notifyId,
            'PTM Feedback Submitted',
            `${notifyName} has submitted feedback for the PTM meeting regarding ${booking.student_name}.`,
            'ptm'
        );

        return { success: true, message: 'Feedback submitted successfully' };
    }

    // Get feedback for a specific PTM meeting
    async getFeedback(bookingId: number): Promise<any[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM ptm_feedback WHERE ptm_meeting_id = ? ORDER BY created_at ASC',
            [bookingId]
        );
        return rows;
    }

    // Delete PTM booking (optional, mostly for cleanup)
    async deletePTMBooking(bookingId: number): Promise<void> {
        await pool.query('DELETE FROM ptm_meetings WHERE id = ?', [bookingId]);
    }
}

export const ptmBookingService = new PTMBookingService();
