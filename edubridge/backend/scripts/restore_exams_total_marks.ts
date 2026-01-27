
import { pool } from '../src/config/database';

async function restore() {
    console.log('Starting restoration: add total_marks back to exams...');

    try {
        const connection = await pool.getConnection();

        // Check if column exists
        const [columns]: any = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'exams' 
            AND COLUMN_NAME = 'total_marks'
        `);

        if (columns.length > 0) {
            console.log('Column total_marks already exists. Skipping.');
            connection.release();
            process.exit(0);
        }

        console.log('Adding total_marks column...');
        await connection.query('ALTER TABLE exams ADD COLUMN total_marks INT DEFAULT 0');

        console.log('Recalculating total_marks for existing exams with questions...');
        await connection.query(`
            UPDATE exams e
            JOIN (
                SELECT exam_id, SUM(marks) as total
                FROM exam_questions
                GROUP BY exam_id
            ) eq ON e.id = eq.exam_id
            SET e.total_marks = eq.total
        `);

        console.log('Restoration completed. Note: Manual exams without questions have total_marks = 0.');
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Restoration failed:', error);
        process.exit(1);
    }
}

restore();
