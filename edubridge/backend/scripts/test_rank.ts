import { pool } from '../src/config/database';

async function testRank() {
    // Get first student
    const [students]: any = await pool.query('SELECT id, class_id FROM students LIMIT 3');

    for (const s of students) {
        const [res]: any = await pool.query(`
            WITH ClassMarks AS (
                SELECT
                    s.id AS student_id,
                    COALESCE(AVG(tm.marks), 0) AS avg_mark
                FROM students s
                LEFT JOIN term_marks tm ON s.id = tm.student_id
                WHERE s.class_id = ?
                GROUP BY s.id
            ),
            Ranked AS (
                SELECT student_id,
                    RANK() OVER (ORDER BY avg_mark DESC) AS class_rank
                FROM ClassMarks
            )
            SELECT class_rank FROM Ranked WHERE student_id = ?
        `, [s.class_id, s.id]);

        console.log(`Student ${s.id} (class ${s.class_id}) => Rank: ${res[0]?.class_rank ?? 'N/A'}`);
    }

    await pool.end();
}

testRank().catch(e => { console.error('Error:', e.message); process.exit(1); });
