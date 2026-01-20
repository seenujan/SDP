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
                    'SELECT id FROM exam_marks WHERE student_id = ? AND exam_id = ?',
                    [mark.student_id, mark.exam_id]
                );

                if (existing.length > 0) {
                    // Update existing marks
                    await connection.query(
                        'UPDATE exam_marks SET marks_obtained = ?, remarks = ? WHERE id = ?',
                        [mark.marks_obtained, mark.remarks || null, existing[0].id]
                    );
                } else {
                    // Insert new marks
                    await connection.query(
                        'INSERT INTO exam_marks (student_id, exam_id, marks_obtained, remarks) VALUES (?, ?, ?, ?)',
                        [mark.student_id, mark.exam_id, mark.marks_obtained, mark.remarks || null]
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
            `SELECT em.*, 
                s.full_name as student_name,
                s.roll_number,
                e.total_marks,
                e.title as exam_title,
                ROUND((em.marks_obtained / e.total_marks) * 100, 2) as percentage
            FROM exam_marks em
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
            `SELECT em.*, 
                e.title as exam_title,
                e.subject,
                e.exam_date,
                e.total_marks,
                ROUND((em.marks_obtained / e.total_marks) * 100, 2) as percentage
            FROM exam_marks em
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
            `SELECT em.*, 
                s.full_name as student_name,
                s.roll_number,
                e.total_marks,
                ROUND((em.marks_obtained / e.total_marks) * 100, 2) as percentage
            FROM exam_marks em
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
            'UPDATE exam_marks SET marks_obtained = ?, remarks = ? WHERE id = ?',
            [marksObtained, remarks || null, markId]
        );

        const [updated] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM exam_marks WHERE id = ?',
            [markId]
        );
        return updated[0];
    }

    // Delete mark entry
    async deleteMark(markId: number): Promise<void> {
        await pool.query('DELETE FROM exam_marks WHERE id = ?', [markId]);
    }

    // Get class performance summary
    async getClassPerformance(grade: string, section: string, examId: number): Promise<any> {
        const [summary] = await pool.query<RowDataPacket[]>(
            `SELECT 
                COUNT(*) as total_students,
                AVG(em.marks_obtained) as average_marks,
                MAX(em.marks_obtained) as highest_marks,
                MIN(em.marks_obtained) as lowest_marks,
                e.total_marks
            FROM exam_marks em
            JOIN students s ON em.student_id = s.id
            JOIN exams e ON em.exam_id = e.id
            WHERE s.grade = ? AND s.section = ? AND em.exam_id = ?`,
            [grade, section, examId]
        );
        return summary[0];
    }
}

export const marksService = new MarksService();
