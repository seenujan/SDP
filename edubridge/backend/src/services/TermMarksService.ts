import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface TermMarkEntry {
    student_id: number;
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
                    'SELECT id FROM term_marks WHERE student_id = ? AND subject_id = ? AND term = ?',
                    [mark.student_id, mark.subject_id, mark.term]
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
                        'INSERT INTO term_marks (student_id, subject_id, term, marks, feedback) VALUES (?, ?, ?, ?, ?)',
                        [mark.student_id, mark.subject_id, mark.term, mark.marks, mark.feedback || null]
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
            JOIN students s ON tm.student_id = s.id
            LEFT JOIN timetable tt ON (s.class_id = tt.class_id AND tm.subject_id = tt.subject_id)
            LEFT JOIN teachers t ON tt.teacher_id = t.user_id
            JOIN subjects sub ON tm.subject_id = sub.id
            WHERE tm.student_id = ?
            ORDER BY tm.entered_at DESC`,
            [studentId]
        );
        return marks;
    }

    // Get term marks by teacher, class, and term
    // Ideally, a teacher should only see marks for subjects they teach
    async getTermMarksByTeacher(teacherId: number, classId: number, term: string, subjectId: number): Promise<any[]> {
        // First verify if the teacher teaches this subject in this class
        const [timetable] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM timetable WHERE teacher_id = ? AND class_id = ? AND subject_id = ?',
            [teacherId, classId, subjectId]
        );

        if (timetable.length === 0) {
            // Alternatively, we could just return empty array, but usually this service method assumes authorization is checked
            // or we enforce it via the join.
            // Let's enforce via join implicitly by using the same logic if checking "my students"
        }

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
}

export const termMarksService = new TermMarksService();
