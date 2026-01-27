import { pool } from './src/config/database';

async function checkSchema() {
    try {
        const [rows] = await pool.execute('DESCRIBE student_exam_answers');
        console.log('student_exam_answers schema:', rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkSchema();
