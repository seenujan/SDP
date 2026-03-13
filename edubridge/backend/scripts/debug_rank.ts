import { pool } from '../src/config/database';

async function debugRank() {
    // Get a class ID that has students
    const [classes]: any = await pool.query('SELECT id FROM classes LIMIT 1');
    const classId = classes[0].id;
    console.log('Testing with class_id:', classId);

    try {
        // Test the SELECT part first
        const [rows]: any = await pool.query(`
            WITH AllScores AS (
                SELECT tm.student_id, tm.marks AS score
                FROM term_marks tm
                JOIN students st ON tm.student_id = st.id
                WHERE st.class_id = ?

                UNION ALL

                SELECT sub.student_id, am.marks AS score
                FROM assignment_marks am
                JOIN assignment_submissions sub ON am.assignment_submission_id = sub.id
                JOIN assignments a ON sub.assignment_id = a.id
                WHERE a.class_id = ?

                UNION ALL

                SELECT sea.student_id,
                    SUM(CASE
                        WHEN qb.question_type IN ('multiple_choice', 'true_false')
                            AND ans.selected_option COLLATE utf8mb4_general_ci = qb.correct_answer COLLATE utf8mb4_general_ci THEN qb.marks
                        WHEN qb.question_type = 'short_answer'
                            AND ans.text_answer IS NOT NULL
                            AND LOWER(ans.text_answer) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(qb.correct_answer) COLLATE utf8mb4_general_ci, '%') THEN qb.marks
                        ELSE 0
                    END) AS score
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
                SELECT st2.id AS student_id,
                    RANK() OVER (ORDER BY COALESCE(sa.overall_avg, 0) DESC) AS class_rank
                FROM students st2
                LEFT JOIN StudentAvg sa ON st2.id = sa.student_id
                WHERE st2.class_id = ?
            )
            SELECT student_id, class_rank FROM Ranked
        `, [classId, classId, classId, classId]);

        console.log('SELECT works! Rows:', rows.length);
        console.log('Sample:', rows.slice(0, 3));

        // Now try the UPDATE
        await pool.query(`
            UPDATE students SET class_rank = null WHERE class_id = ?
        `, [classId]);

        for (const row of rows) {
            await pool.query('UPDATE students SET class_rank = ? WHERE id = ?', [row.class_rank, row.student_id]);
        }
        console.log('UPDATE done!');

        const [check]: any = await pool.query('SELECT id, full_name, class_rank FROM students WHERE class_id = ?', [classId]);
        check.forEach((r: any) => console.log(`  ${r.full_name} => #${r.class_rank}`));

    } catch (e: any) {
        console.error('Error:', e.message);
    }

    await pool.end();
}

debugRank();
