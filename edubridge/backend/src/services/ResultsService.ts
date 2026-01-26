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
                sub.subject_name as subject,
                e.exam_date,
                e.total_marks,
                oem.score as obtained_marks,
                ROUND((oem.score / e.total_marks) * 100, 2) as percentage
            FROM online_exam_marks oem
            JOIN exams e ON oem.exam_id = e.id
            JOIN subjects sub ON e.subject_id = sub.id
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
                sub.subject_name as subject,
                a.due_date,
                am.marks as obtained_marks,
                am.feedback,
                subm.submitted_at
            FROM assignment_marks am
            JOIN assignment_submissions subm ON am.assignment_submission_id = subm.id
            JOIN assignments a ON subm.assignment_id = a.id
            JOIN subjects sub ON a.subject_id = sub.id
            WHERE subm.student_id = ?
            ORDER BY subm.submitted_at DESC`,
            [studentId]
        );

        // 3. Term Marks (Manual)
        // term_marks table DOES NOT HAVE total_marks
        const [termResults] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                tm.id,
                tm.term,
                sub.subject_name as subject,
                tm.marks as obtained_marks,
                tm.feedback,
                tm.entered_at
            FROM term_marks tm
            JOIN subjects sub ON tm.subject_id = sub.id
            WHERE tm.student_id = ?
            ORDER BY tm.entered_at DESC`,
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
