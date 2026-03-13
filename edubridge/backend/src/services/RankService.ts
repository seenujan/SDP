import { pool } from '../config/database';

/**
 * Recalculates and saves class_rank for ALL students in a given class.
 * Called automatically whenever marks change:
 *   - After term_marks are saved (TermMarksService)
 *   - After assignment marks are saved (AssignmentService)
 *   - After a student submits an online exam (ExamService)
 *
 * Rank formula — combined overall score from all 3 sources:
 *   1. Term marks       — from term_marks table
 *   2. Assignment marks — from assignment_marks (via assignment_submissions)
 *   3. Exam scores      — auto-graded from student_exam_answers
 * All pooled together, averaged per student, then RANK() DESC within class.
 */
export async function recalculateClassRanks(classId: number): Promise<void> {
    // Step 1: Compute ranks with a CTE SELECT
    const [rows]: any = await pool.query(`
        WITH AllScores AS (
            -- 1. Term marks
            SELECT tm.student_id, tm.marks AS score
            FROM term_marks tm
            JOIN students st ON tm.student_id = st.id
            WHERE st.class_id = ?

            UNION ALL

            -- 2. Assignment marks
            SELECT sub.student_id, am.marks AS score
            FROM assignment_marks am
            JOIN assignment_submissions sub ON am.assignment_submission_id = sub.id
            JOIN assignments a ON sub.assignment_id = a.id
            WHERE a.class_id = ?

            UNION ALL

            -- 3. Online exam scores (auto-graded)
            SELECT sea.student_id,
                SUM(
                    CASE
                        WHEN qb.question_type IN ('multiple_choice', 'true_false')
                            AND ans.selected_option COLLATE utf8mb4_general_ci = qb.correct_answer COLLATE utf8mb4_general_ci THEN qb.marks
                        WHEN qb.question_type = 'short_answer'
                            AND ans.text_answer IS NOT NULL
                            AND LOWER(ans.text_answer) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(qb.correct_answer) COLLATE utf8mb4_general_ci, '%') THEN qb.marks
                        ELSE 0
                    END
                ) AS score
            FROM student_exam_attempts sea
            JOIN student_exam_answers ans ON sea.id = ans.attempt_id
            JOIN question_bank qb ON ans.question_id = qb.id
            JOIN exams e ON sea.exam_id = e.id
            WHERE e.class_id = ? AND sea.status IN ('submitted', 'evaluated')
            GROUP BY sea.id, sea.student_id
        ),
        StudentAvg AS (
            SELECT student_id, AVG(score) AS overall_avg
            FROM AllScores
            GROUP BY student_id
        ),
        Ranked AS (
            SELECT
                st2.id AS student_id,
                RANK() OVER (ORDER BY COALESCE(sa.overall_avg, 0) DESC) AS class_rank
            FROM students st2
            LEFT JOIN StudentAvg sa ON st2.id = sa.student_id
            WHERE st2.class_id = ?
        )
        SELECT student_id, class_rank FROM Ranked
    `, [classId, classId, classId, classId]);

    // Step 2: Write each rank back to the students table
    if (rows.length === 0) return;

    const updatePromises = rows.map((row: any) =>
        pool.query('UPDATE students SET class_rank = ? WHERE id = ?', [row.class_rank, row.student_id])
    );
    await Promise.all(updatePromises);
}
