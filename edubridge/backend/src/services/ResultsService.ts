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
                (
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN qb.question_type IN ('multiple_choice', 'true_false') AND ans.selected_option COLLATE utf8mb4_unicode_ci = qb.correct_answer COLLATE utf8mb4_unicode_ci THEN qb.marks
                            WHEN qb.question_type = 'short_answer' AND ans.text_answer IS NOT NULL AND LOWER(ans.text_answer) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', LOWER(qb.correct_answer) COLLATE utf8mb4_unicode_ci, '%') THEN qb.marks
                            ELSE 0 
                        END
                    ), 0)
                    FROM student_exam_answers ans
                    JOIN question_bank qb ON ans.question_id = qb.id
                    JOIN student_exam_attempts sea_inner ON ans.attempt_id = sea_inner.id
                    WHERE sea_inner.student_id = ? AND sea_inner.exam_id = e.id
                    AND sea_inner.status IN ('submitted', 'evaluated')
                    ORDER BY sea_inner.id DESC LIMIT 1
                ) as obtained_marks,
                ROUND(
                    (
                        SELECT COALESCE(SUM(
                            CASE 
                                WHEN qb.question_type IN ('multiple_choice', 'true_false') AND ans.selected_option COLLATE utf8mb4_unicode_ci = qb.correct_answer COLLATE utf8mb4_unicode_ci THEN qb.marks
                                WHEN qb.question_type = 'short_answer' AND ans.text_answer IS NOT NULL AND LOWER(ans.text_answer) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', LOWER(qb.correct_answer) COLLATE utf8mb4_unicode_ci, '%') THEN qb.marks
                                ELSE 0 
                            END
                        ), 0)
                        FROM student_exam_answers ans
                        JOIN question_bank qb ON ans.question_id = qb.id
                        JOIN student_exam_attempts sea_inner ON ans.attempt_id = sea_inner.id
                        WHERE sea_inner.student_id = ? AND sea_inner.exam_id = e.id
                        AND sea_inner.status IN ('submitted', 'evaluated')
                        ORDER BY sea_inner.id DESC LIMIT 1
                    ) / e.total_marks * 100, 2
                ) as percentage
            FROM exams e
            JOIN subjects sub ON e.subject_id = sub.id
            JOIN student_exam_attempts sea ON e.id = sea.exam_id
            WHERE sea.student_id = ? AND sea.status IN ('submitted', 'evaluated')
            GROUP BY e.id, e.title, sub.subject_name, e.exam_date, e.total_marks
            ORDER BY e.exam_date DESC`,
            [studentId, studentId, studentId]
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
