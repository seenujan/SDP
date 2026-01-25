
import { pool } from '../config/database';

async function verifyTables() {
    try {
        console.log('Verifying exam tables...');
        const tables = ['exam_questions', 'student_exam_attempts', 'student_exam_answers'];

        for (const table of tables) {
            const [rows]: any = await pool.query(`SHOW TABLES LIKE '${table}'`);
            if (rows.length > 0) {
                console.log(`✅ Table '${table}' exists.`);
            } else {
                console.error(`❌ Table '${table}' is MISSING!`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyTables();
