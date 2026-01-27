
import { pool } from '../src/config/database';

async function checkExams() {
    try {
        const [rows]: any = await pool.query(`
            SELECT e.id, e.title, e.exam_date, 
            (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count
            FROM exams e
        `);

        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkExams();
