import { pool } from '../config/database';

export class AttendanceService {
    // Mark attendance for a student
    async markAttendance(data: {
        studentId: number;
        status: 'present' | 'absent' | 'late';
        date: string;
        timetableId: number;
    }) {
        // Check if attendance record already exists
        const [existing]: any = await pool.query(
            'SELECT id FROM attendance WHERE student_id = ? AND date = ? AND timetable_id = ?',
            [data.studentId, data.date, data.timetableId]
        );

        if (existing && existing.length > 0) {
            // Update existing record
            const [result] = await pool.query(
                'UPDATE attendance SET status = ? WHERE id = ?',
                [data.status, existing[0].id]
            );
            return result;
        } else {
            // Insert new record
            const [result] = await pool.query(
                'INSERT INTO attendance (student_id, status, date, timetable_id) VALUES (?, ?, ?, ?)',
                [data.studentId, data.status, data.date, data.timetableId]
            );
            return result;
        }
    }

    // Mark attendance for multiple students at once
    async markBulkAttendance(attendanceData: Array<{
        studentId: number;
        status: 'present' | 'absent' | 'late';
        date: string;
        timetableId: number;
    }>) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const data of attendanceData) {
                // Check if attendance record already exists for this student, date, and timetable slot
                const [existing]: any = await connection.query(
                    'SELECT id FROM attendance WHERE student_id = ? AND date = ? AND timetable_id = ?',
                    [data.studentId, data.date, data.timetableId]
                );

                if (existing && existing.length > 0) {
                    // Update existing record
                    await connection.query(
                        'UPDATE attendance SET status = ? WHERE id = ?',
                        [data.status, existing[0].id]
                    );
                } else {
                    // Insert new record
                    await connection.query(
                        'INSERT INTO attendance (student_id, status, date, timetable_id) VALUES (?, ?, ?, ?)',
                        [data.studentId, data.status, data.date, data.timetableId]
                    );
                }
            }

            await connection.commit();
            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get attendance for a student
    async getStudentAttendance(studentId: number) {
        const [rows] = await pool.query(
            `SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC`,
            [studentId]
        );

        return rows;
    }

    // Get class attendance for a specific date
    async getClassAttendance(grade: string, date: string) {
        // Fetch class IDs for this grade
        // Note: grade string passed might be just "Grade 10" or "Grade 10 A" depending on usage. 
        // Logic might need adjustment but sticking to existing pattern where possible.
        // Assuming this method fetches based on grade level (all sections?)

        const [rows] = await pool.query(
            `SELECT 
        a.*, 
        s.full_name,
        s.roll_number,
        s.section,
        sub.subject_name as subject
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN timetable t ON a.timetable_id = t.id
      JOIN subjects sub ON t.subject_id = sub.id
      WHERE s.grade = ? AND a.date = ?
      ORDER BY s.roll_number, s.full_name`,
            [grade, date]
        );

        return rows;
    }

    // Get attendance statistics
    async getAttendanceStats(studentId: number) {
        const [rows]: any = await pool.query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance
      WHERE student_id = ?`,
            [studentId]
        );

        const stats = rows[0];
        const percentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0;

        return {
            ...stats,
            percentage,
        };
    }
}

export const attendanceService = new AttendanceService();
