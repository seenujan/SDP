import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface TermMarkEntry {
    student_id: number;
    teacher_id: number;
    subject_id: number;
    term: string;
    marks: number;
    feedback?: string;
}

export class TermMarksService {
    // Upload term marks in bulk
    async uploadTermMarks(marksData: TermMarkEntry[]): Promise<any> {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const mark of marksData) {
                // Check if marks already exist
                const [existing] = await connection.query<RowDataPacket[]>(
                    'SELECT id FROM term_marks WHERE student_id = ? AND teacher_id = ? AND subject_id = ? AND term = ?',
                    [mark.student_id, mark.teacher_id, mark.subject_id, mark.term]
                );

                if (existing.length > 0) {
                    // Update existing marks
                    await connection.query(
                        'UPDATE term_marks SET marks = ?, feedback = ? WHERE id = ?',
                        [mark.marks, mark.feedback || null, existing[0].id]
                    );
                } else {
                    // Insert new marks
                    await connection.query(
                        'INSERT INTO term_marks (student_id, teacher_id, subject_id, term, marks, feedback) VALUES (?, ?, ?, ?, ?, ?)',
                        [mark.student_id, mark.teacher_id, mark.subject_id, mark.term, mark.marks, mark.feedback || null]
                    );
                }
            }

            await connection.commit();
            return { success: true, message: 'Term marks uploaded successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get term marks for a specific class and term
    async getTermMarksByClass(classId: number, term: string, subjectId: number): Promise<any[]> {
        const [marks] = await pool.query<RowDataPacket[]>(
            `SELECT tm.*, 
                s.full_name as student_name,
                s.roll_number,
                s.id as student_id,
                sub.subject_name as subject
            FROM term_marks tm
            JOIN students s ON tm.student_id = s.id
            JOIN subjects sub ON tm.subject_id = sub.id
            WHERE s.class_id = ? AND tm.term = ? AND tm.subject_id = ?
            ORDER BY s.roll_number`,
            [classId, term, subjectId]
        );
        return marks;
    }

    // Get term marks for a specific student
    async getTermMarksByStudent(studentId: number): Promise<any[]> {
        const [marks] = await pool.query<RowDataPacket[]>(
            `SELECT tm.*, 
                t.full_name as teacher_name,
                sub.subject_name as subject
            FROM term_marks tm
            JOIN teachers t ON tm.teacher_id = t.user_id
            JOIN subjects sub ON tm.subject_id = sub.id
            WHERE tm.student_id = ?
            ORDER BY tm.entered_at DESC`,
            [studentId]
        );
        return marks;
    }

    // Get term marks by teacher, class, and term
    async getTermMarksByTeacher(teacherId: number, classId: number, term: string, subjectId: number): Promise<any[]> {
        const [marks] = await pool.query<RowDataPacket[]>(
            `SELECT tm.*, 
                s.full_name as student_name,
                s.roll_number,
                s.id as student_id,
                sub.subject_name as subject
            FROM term_marks tm
            JOIN students s ON tm.student_id = s.id
            JOIN subjects sub ON tm.subject_id = sub.id
            WHERE tm.teacher_id = ? AND s.class_id = ? AND tm.term = ? AND tm.subject_id = ?
            ORDER BY s.roll_number`,
            [teacherId, classId, term, subjectId]
        );
        return marks;
    }
}

export const termMarksService = new TermMarksService();
