import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

class ResultsService {
    // Get all results for a student
    async getStudentResults(studentId: number) {
        // 1. Online Exam Marks (joined with exams)
        // exams table HAS total_marks
        const [examResults] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                e.id, 
                e.title as exam_title,
                e.subject,
                e.exam_date,
                e.total_marks,
                oem.score as obtained_marks,
                ROUND((oem.score / e.total_marks) * 100, 2) as percentage
            FROM online_exam_marks oem
            JOIN exams e ON oem.exam_id = e.id
            WHERE oem.student_id = ?
            ORDER BY e.exam_date DESC`,
            [studentId]
        );

        // 2. Assignment Marks
        // assignments table DOES NOT HAVE total_marks
        const [assignmentResults] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                a.id,
                a.title as assignment_title,
                a.subject,
                a.due_date,
                am.marks as obtained_marks,
                am.feedback,
                sub.submitted_at
            FROM assignment_marks am
            JOIN assignment_submissions sub ON am.assignment_submission_id = sub.id
            JOIN assignments a ON sub.assignment_id = a.id
            WHERE sub.student_id = ?
            ORDER BY sub.submitted_at DESC`,
            [studentId]
        );

        // 3. Term Marks (Manual)
        // term_marks table DOES NOT HAVE total_marks
        const [termResults] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                id,
                term,
                subject,
                marks as obtained_marks,
                feedback,
                entered_at
            FROM term_marks
            WHERE student_id = ?
            ORDER BY entered_at DESC`,
            [studentId]
        );

        return {
            exams: examResults,
            assignments: assignmentResults,
            terms: termResults
        };
    }
}

export const resultsService = new ResultsService();
