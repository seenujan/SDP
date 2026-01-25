import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface MarkEntry {
    student_id: number;
    exam_id: number;
    marks_obtained: number;
    remarks?: string;
}

export class MarksService {
    // Upload marks in bulk
    async uploadMarks(marksData: MarkEntry[]): Promise<any> {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const mark of marksData) {
                // Check if marks already exist
                const [existing] = await connection.query<RowDataPacket[]>(
                    'SELECT id FROM online_exam_marks WHERE student_id = ? AND exam_id = ?',
                    [mark.student_id, mark.exam_id]
                );

                if (existing.length > 0) {
                    // Update existing marks
                    await connection.query(
                        'UPDATE online_exam_marks SET score = ? WHERE id = ?',
                        [mark.marks_obtained, existing[0].id]
                    );
                } else {
                    // Insert new marks
                    await connection.query(
                        'INSERT INTO online_exam_marks (student_id, exam_id, score, entered_at) VALUES (?, ?, ?, NOW())',
                        [mark.student_id, mark.exam_id, mark.marks_obtained]
                    );
                }
            }

            await connection.commit();
            return { success: true, message: 'Marks uploaded successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get marks for a specific exam
    async getMarksByExam(examId: number): Promise<any[]> {
        const [marks] = await pool.query<RowDataPacket[]>(
            `SELECT em.id,
                em.student_id,
                em.exam_id,
                em.score as marks_obtained,
                em.entered_at, 
                s.full_name as student_name,
                s.roll_number,
                e.total_marks,
                e.title as exam_title,
                ROUND((em.score / e.total_marks) * 100, 2) as percentage
            FROM online_exam_marks em
            JOIN students s ON em.student_id = s.id
            JOIN exams e ON em.exam_id = e.id
            WHERE em.exam_id = ?
            ORDER BY s.roll_number`,
            [examId]
        );
        return marks;
    }

    // Get marks for a student
    async getMarksByStudent(studentId: number): Promise<any[]> {
        const [marks] = await pool.query<RowDataPacket[]>(
            `SELECT em.id,
                em.student_id,
                em.exam_id,
                em.score as marks_obtained,
                em.entered_at,
                e.title as exam_title,
                e.subject,
                e.exam_date,
                e.total_marks,
                ROUND((em.score / e.total_marks) * 100, 2) as percentage
            FROM online_exam_marks em
            JOIN exams e ON em.exam_id = e.id
            WHERE em.student_id = ?
            ORDER BY e.exam_date DESC`,
            [studentId]
        );
        return marks;
    }

    // Get marks by class and exam
    async getMarksByClassAndExam(grade: string, section: string, examId: number): Promise<any[]> {
        const [marks] = await pool.query<RowDataPacket[]>(
            `SELECT em.id,
                em.student_id,
                em.exam_id,
                em.score as marks_obtained,
                em.entered_at,
                s.full_name as student_name,
                s.roll_number,
                e.total_marks,
                ROUND((em.score / e.total_marks) * 100, 2) as percentage
            FROM online_exam_marks em
            JOIN students s ON em.student_id = s.id
            JOIN exams e ON em.exam_id = e.id
            WHERE s.grade = ? AND s.section = ? AND em.exam_id = ?
            ORDER BY s.roll_number`,
            [grade, section, examId]
        );
        return marks;
    }

    // Update individual mark
    async updateMark(markId: number, marksObtained: number, remarks?: string): Promise<any> {
        await pool.query(
            'UPDATE online_exam_marks SET score = ? WHERE id = ?',
            [marksObtained, markId]
        );

        const [updated] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM online_exam_marks WHERE id = ?',
            [markId]
        );
        return updated[0];
    }

    // Delete mark entry
    async deleteMark(markId: number): Promise<void> {
        await pool.query('DELETE FROM online_exam_marks WHERE id = ?', [markId]);
    }

    // Get class performance summary
    async getClassPerformance(grade: string, section: string, examId: number): Promise<any> {
        const [summary] = await pool.query<RowDataPacket[]>(
            `SELECT 
                COUNT(*) as total_students,
                AVG(em.score) as average_marks,
                MAX(em.score) as highest_marks,
                MIN(em.score) as lowest_marks,
                e.total_marks
            FROM online_exam_marks em
            JOIN students s ON em.student_id = s.id
            JOIN exams e ON em.exam_id = e.id
            WHERE s.grade = ? AND s.section = ? AND em.exam_id = ?`,
            [grade, section, examId]
        );
        return summary[0];
    }
}

export const marksService = new MarksService();
