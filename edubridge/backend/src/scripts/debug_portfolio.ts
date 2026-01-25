import { pool } from '../config/database';

async function debugPortfolio() {
    try {
        console.log('=== Debugging Portfolio ===');

        // 1. Get a student (e.g., user_id 3 which corresponds to student_id 1 based on screens)
        const userId = 3;
        console.log(`\nChecking student for user_id: ${userId}`);
        const [students]: any = await pool.query('SELECT id, full_name FROM students WHERE user_id = ?', [userId]);
        console.log(JSON.stringify(students, null, 2));

        if (students.length > 0) {
            const studentId = students[0].id;
            console.log(`\nChecking portfolios for student_id: ${studentId}`);

            // 2. Run the Service Query
            const [rows]: any = await pool.query(
                `SELECT p.*, 
                        COALESCE(t.full_name, 'Teacher') as teacher_name
                 FROM portfolios p
                 LEFT JOIN teachers t ON p.teacher_id = t.user_id
                 WHERE p.student_id = ?`,
                [studentId]
            );
            console.log(`\nService Query returned ${rows.length} rows.`);
            if (rows.length > 0) {
                console.log('First row sample:', JSON.stringify(rows[0], null, 2));
            }

            // 3. Run a simpler query to verify raw data
            const [raw]: any = await pool.query('SELECT * FROM portfolios WHERE student_id = ?', [studentId]);
            console.log('\nRaw Portfolio Table Data:');
            console.log(JSON.stringify(raw, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

debugPortfolio();
