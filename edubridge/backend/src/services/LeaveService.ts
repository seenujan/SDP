import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PTMBookingService } from './PTMBookingService';
import { notificationService } from './NotificationService';

export class LeaveService {
    // Get all leave types (Casual, Medical, etc.)
    static async getLeaveTypes() {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM leave_types');
        return rows;
    }

    // Apply for leave
    static async applyLeave(teacherId: number, data: any) {
        const { leave_type_id, start_date, end_date, reason, relief_teacher_id, is_half_day } = data;

        // 0. Validate Relief Teacher
        if (!relief_teacher_id || Number(relief_teacher_id) <= 0) {
            throw new Error('A relief teacher must be assigned for this leave application.');
        }

        // 1. Validate overlapping dates
        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM teacher_leaves 
             WHERE teacher_id = ? AND status != 'rejected' AND status != 'cancelled'
             AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?) OR (? BETWEEN start_date AND end_date))`,
            [teacherId, start_date, end_date, start_date, end_date, start_date]
        );

        if (existing.length > 0) {
            throw new Error('Leave dates overlap with an existing application.');
        }

        // 2. Insert with Relief Status
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO teacher_leaves 
            (teacher_id, leave_type_id, start_date, end_date, is_half_day, reason, relief_teacher_id, status, relief_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'Pending')`,
            [teacherId, leave_type_id, start_date, end_date, is_half_day || false, reason, relief_teacher_id]
        );

        const leaveId = result.insertId;

        // 3. Notify Relief Teacher
        if (relief_teacher_id) {
            // Get Applicant Name
            const [users] = await pool.query<RowDataPacket[]>('SELECT full_name FROM teachers WHERE user_id = ?', [teacherId]);
            const applicantName = users[0]?.full_name || 'A colleague';

            await notificationService.createNotification(
                relief_teacher_id,
                'Relief Teacher Request',
                `${applicantName} has requested you as a relief teacher from ${start_date} to ${end_date}.`,
                'relief_request'
            );
        }

        return leaveId;
    }

    // Get Relief Requests for a Teacher
    static async getReliefRequests(teacherId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT l.*, 
                    t.full_name as applicant_name,
                    lt.name as leave_type_name
             FROM teacher_leaves l
             JOIN teachers t ON l.teacher_id = t.user_id
             JOIN leave_types lt ON l.leave_type_id = lt.id
             WHERE l.relief_teacher_id = ? AND l.relief_status = 'Pending'
             ORDER BY l.created_at DESC`,
            [teacherId]
        );
        return rows;
    }

    // Respond to Relief Request
    static async respondToReliefRequest(leaveId: number, teacherId: number, status: 'Approved' | 'Rejected', reason?: string) {
        // Verify assignment
        const [leave] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM teacher_leaves WHERE id = ? AND relief_teacher_id = ?',
            [leaveId, teacherId]
        );

        if (leave.length === 0) throw new Error('Relief request not found or not assigned to you.');

        await pool.query(
            'UPDATE teacher_leaves SET relief_status = ?, relief_rejection_reason = ? WHERE id = ?',
            [status, reason || null, leaveId]
        );

        // Notify Applicant
        const applicantId = leave[0].teacher_id;
        const [responder] = await pool.query<RowDataPacket[]>('SELECT full_name FROM teachers WHERE user_id = ?', [teacherId]);
        const responderName = responder[0]?.full_name || 'Relief Teacher';

        await notificationService.createNotification(
            applicantId,
            `Relief Request ${status}`,
            `${responderName} has ${status.toLowerCase()} your relief request.${reason ? ` Reason: ${reason}` : ''}`,
            'relief_request'
        );

        return true;
    }

    // Cancel Leave
    static async cancelLeave(leaveId: number, teacherId: number) {
        // Verify ownership and status
        const [leaves] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM teacher_leaves WHERE id = ? AND teacher_id = ?',
            [leaveId, teacherId]
        );

        if (leaves.length === 0) throw new Error('Leave application not found.');
        const leave = leaves[0];

        if (leave.status === 'rejected' || leave.status === 'cancelled') {
            throw new Error('Leave is already processed/cancelled.');
        }

        // Cancel
        await pool.query('UPDATE teacher_leaves SET status = "cancelled" WHERE id = ?', [leaveId]);

        // Notify Relief Teacher if they were approved/pending
        if (leave.relief_teacher_id) {
            await notificationService.createNotification(
                leave.relief_teacher_id,
                'Relief Request Cancelled',
                'The leave application requiring your relief work has been cancelled by the applicant.',
                'leave_update'
            );
        }

        return true;
    }

    // Calculate Balance (Strict 3NF - Calculation on the fly)
    static async getLeaveBalance(teacherId: number, year: number) {
        // 1. Get Quotas
        const [types] = await pool.query<RowDataPacket[]>('SELECT * FROM leave_types');

        // 2. Get Used Days
        // Logic: Sum of datediff + 1 for each approved leave in this year
        // We filter by year based on start_date
        const [usedRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                l.leave_type_id, 
                SUM(
                    CASE 
                        WHEN l.is_half_day = 1 THEN 0.5 
                        ELSE DATEDIFF(l.end_date, l.start_date) + 1 
                    END
                ) as used_days
             FROM teacher_leaves l
             WHERE l.teacher_id = ? 
             AND l.status = 'approved'
             AND YEAR(l.start_date) = ?
             GROUP BY l.leave_type_id`,
            [teacherId, year]
        );

        // Map results
        const balances = types.map(type => {
            const usedEntry = usedRows.find((u: any) => u.leave_type_id === type.id);
            const used = usedEntry ? parseFloat(usedEntry.used_days) : 0;
            return {
                type_id: type.id,
                name: type.name,
                quota: type.default_annual_quota,
                used: used,
                remaining: type.default_annual_quota > 0 ? (type.default_annual_quota - used) : 'Unlimited'
            };
        });

        return balances;
    }

    // Get History for Teacher
    static async getTeacherHistory(teacherId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT l.*, 
                    rt.full_name as relief_teacher_name,
                    lt.name as leave_type_name
             FROM teacher_leaves l
             JOIN teachers t ON l.teacher_id = t.user_id
             LEFT JOIN teachers rt ON l.relief_teacher_id = rt.user_id
             JOIN leave_types lt ON l.leave_type_id = lt.id
             WHERE l.teacher_id = ?
             ORDER BY l.created_at DESC`,
            [teacherId]
        );
        return rows;
    }

    // Helper: Get relevant class names based on leave dates
    private static async attachClassNames(leaves: any[]) {
        for (const leave of leaves) {
            // 1. Calculate days between start and end date
            const days: string[] = [];
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);

            // Loop through dates
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Get day name (e.g., 'Monday')
                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                if (!days.includes(dayName)) days.push(dayName);
            }

            // 2. Fetch classes for this teacher on these days
            if (days.length > 0) {
                const placeholders = days.map(() => '?').join(',');
                const [classes] = await pool.query<RowDataPacket[]>(
                    `SELECT DISTINCT CONCAT(c.grade, '-', c.section) as class_name
                     FROM timetable t
                     JOIN classes c ON t.class_id = c.id
                     WHERE t.teacher_id = ? 
                     AND t.day_of_week IN (${placeholders})`,
                    [leave.teacher_id, ...days]
                );

                leave.class_names = classes.map((c: any) => c.class_name).join(', ');
            } else {
                leave.class_names = '';
            }
        }
        return leaves;
    }

    // Get Pending Leaves for Admin
    static async getPendingLeaves() {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT l.*, 
                    t.full_name as teacher_name, 
                    rt.full_name as relief_teacher_name,
                    lt.name as leave_type_name
             FROM teacher_leaves l
             JOIN teachers t ON l.teacher_id = t.user_id
             LEFT JOIN teachers rt ON l.relief_teacher_id = rt.user_id
             JOIN leave_types lt ON l.leave_type_id = lt.id
             WHERE l.status = 'pending'
             ORDER BY l.start_date ASC`
        );
        return await this.attachClassNames(rows);
    }

    // Get All Leaves for Admin (History)
    static async getAllLeaves() {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT l.*, 
                    t.full_name as teacher_name, 
                    rt.full_name as relief_teacher_name,
                    lt.name as leave_type_name
             FROM teacher_leaves l
             JOIN teachers t ON l.teacher_id = t.user_id
             LEFT JOIN teachers rt ON l.relief_teacher_id = rt.user_id
             JOIN leave_types lt ON l.leave_type_id = lt.id
             ORDER BY l.created_at DESC`
        );
        return await this.attachClassNames(rows);
    }

    // Approve/Reject Leave
    static async updateLeaveStatus(leaveId: number, status: 'approved' | 'rejected', rejectionReason: string | null, approverId: number) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                `UPDATE teacher_leaves 
                 SET status = ?, rejection_reason = ?, approver_id = ?
                 WHERE id = ?`,
                [status, rejectionReason, approverId, leaveId]
            );

            // AUTO-CANCELLATION LOGIC
            if (status === 'approved') {
                // Get leave details to check relief status
                const [leaveRows] = await connection.query<RowDataPacket[]>(
                    `SELECT teacher_id, start_date, end_date, relief_status FROM teacher_leaves WHERE id = ?`,
                    [leaveId]
                );

                if (leaveRows.length === 0) {
                    throw new Error('Leave request not found.');
                }

                const leave = leaveRows[0];

                if (leave.relief_status !== 'Approved') {
                    throw new Error('Cannot approve leave until relief teacher has accepted the request.');
                }

                // Notify Applicant
                await notificationService.createNotification(
                    leave.teacher_id,
                    'Leave Request Approved',
                    `Your leave request from ${leave.start_date} to ${leave.end_date} has been approved.`,
                    'leave_update'
                );


                // Find conflicting PTMs
                const [ptms] = await connection.query<RowDataPacket[]>(
                    `SELECT id, parent_id, meeting_date, meeting_time 
                     FROM ptm_meetings 
                     WHERE teacher_id = ? 
                     AND status IN ('pending', 'approved')
                     AND meeting_date BETWEEN ? AND ?`,
                    [leave.teacher_id, leave.start_date, leave.end_date]
                );

                for (const ptm of ptms) {
                    // Update status
                    await connection.query(
                        `UPDATE ptm_meetings 
                         SET status = 'reschedule_requested', 
                             rejection_reason = 'Teacher on Leave' 
                         WHERE id = ?`,
                        [ptm.id]
                    );

                    // Notify Parent
                    await notificationService.createNotification(
                        ptm.parent_id,
                        'PTM Meeting Cancelled',
                        `Your PTM on ${ptm.meeting_date} has been cancelled because the teacher is on leave. Please reschedule.`,
                        'ptm'
                    );
                }
            } else if (status === 'rejected') {
                // Get leave details
                const [leaveRows] = await connection.query<RowDataPacket[]>(
                    `SELECT teacher_id FROM teacher_leaves WHERE id = ?`,
                    [leaveId]
                );
                const leave = leaveRows[0];

                // Notify Applicant
                await notificationService.createNotification(
                    leave.teacher_id,
                    'Leave Request Rejected',
                    `Your leave request has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
                    'leave_update'
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    // Get Available Relief Teachers (Same Subject + Not on Leave)
    static async getAvailableReliefTeachers(teacherId: number, startDate: string, endDate: string) {
        // 1. Get Current Teacher's Subject
        const [teacherRows] = await pool.query<RowDataPacket[]>(
            'SELECT subject_id FROM teachers WHERE user_id = ?',
            [teacherId]
        );
        const subjectId = teacherRows[0]?.subject_id;

        // 2. Base Query: Teachers with same subject, excluding self
        let query = `
            SELECT t.user_id as id, t.full_name, s.subject_name as subject
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.user_id != ? 
        `;
        const params: any[] = [teacherId];

        if (subjectId) {
            query += ' AND t.subject_id = ?';
            params.push(subjectId);
        }

        // 3. Exclude teachers on leave during the requested dates
        if (startDate && endDate) {
            query += `
                AND t.user_id NOT IN (
                    SELECT teacher_id FROM teacher_leaves 
                    WHERE status IN ('pending', 'approved')
                    AND (
                        (start_date BETWEEN ? AND ?) OR 
                        (end_date BETWEEN ? AND ?) OR
                        (start_date <= ? AND end_date >= ?)
                    )
                )
            `;
            params.push(startDate, endDate, startDate, endDate, startDate, endDate);
        }

        query += ' ORDER BY t.full_name';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return rows;
    }
}
