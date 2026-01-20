import { pool } from '../config/database';

export class AttendanceService {
    // Mark attendance for a student
    async markAttendance(data: {
        studentId: number;
        status: 'present' | 'absent' | 'late';
        date: string;
        class?: string;
        subject?: string;
    }) {
        const [result] = await pool.query(
            'INSERT INTO attendance (student_id, status, date, class, subject) VALUES (?, ?, ?, ?, ?)',
            [data.studentId, data.status, data.date, data.class || null, data.subject || null]
        );

        return result;
    }

    // Mark attendance for multiple students at once
    async markBulkAttendance(attendanceData: Array<{
        studentId: number;
        status: 'present' | 'absent' | 'late';
        date: string;
        class?: string;
        subject?: string;
    }>) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const data of attendanceData) {
                // Check if attendance record already exists for this student, date, and subject
                const [existing]: any = await connection.query(
                    'SELECT id FROM attendance WHERE student_id = ? AND date = ? AND (subject = ? OR (subject IS NULL AND ? IS NULL))',
                    [data.studentId, data.date, data.subject || null, data.subject || null]
                );

                if (existing && existing.length > 0) {
                    // Update existing record
                    await connection.query(
                        'UPDATE attendance SET status = ?, class = ? WHERE id = ?',
                        [data.status, data.class || null, existing[0].id]
                    );
                } else {
                    // Insert new record
                    await connection.query(
                        'INSERT INTO attendance (student_id, status, date, class, subject) VALUES (?, ?, ?, ?, ?)',
                        [data.studentId, data.status, data.date, data.class || null, data.subject || null]
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
        const [rows] = await pool.query(
            `SELECT 
        a.*, 
        s.full_name,
        s.roll_number,
        s.section
      FROM attendance a
      JOIN students s ON a.student_id = s.id
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
