
import { pool } from '../src/config/database';

async function verifyAssignments() {
    try {
        console.log('=== Verifying Assignments ===');

        // 1. Get all assignments
        const [assignments]: any = await pool.query('SELECT id, title, grade, section FROM assignments');
        console.log(`Found ${assignments.length} assignments`);

        for (const assignment of assignments) {
            console.log(`\nAssignment [${assignment.id}] "${assignment.title}" (${assignment.grade} ${assignment.section || 'All'})`);

            // 2. Count raw submissions
            const [submissions]: any = await pool.query(
                'SELECT * FROM assignment_submissions WHERE assignment_id = ?',
                [assignment.id]
            );
            console.log(`- Raw Submissions count: ${submissions.length}`);

            if (submissions.length > 0) {
                // 3. Test service query (LEFT JOIN)
                const [joinedRows]: any = await pool.query(
                    `SELECT 
                        sub.id,
                        sub.student_id,
                        s.full_name as student_name,
                        s.id as student_table_id
                    FROM assignment_submissions sub
                    LEFT JOIN students s ON sub.student_id = s.id
                    WHERE sub.assignment_id = ?`,
                    [assignment.id]
                );

                console.log('- Service Query Results:');
                joinedRows.forEach((row: any) => {
                    console.log(`  - Submission ID: ${row.id}, Student ID: ${row.student_id}, Name: ${row.student_name || 'NULL (Mismatch!)'}, Student Table Match: ${row.student_table_id ? 'Yes' : 'No'}`);
                });
            }
        }

    } catch (error) {
        console.error('Error verifying assignments:', error);
    } finally {
        process.exit();
    }
}

verifyAssignments();
