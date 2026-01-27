import { pool } from './src/config/database';
import { RowDataPacket } from 'mysql2';

async function checkScoreUsage() {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as count, COUNT(score) as nonNullScore FROM student_exam_attempts'
        );
        console.log('Total Attempts:', rows[0].count);
        console.log('Attempts with Score:', rows[0].nonNullScore);

        if (rows[0].nonNullScore > 0) {
            const [examples] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM student_exam_attempts WHERE score IS NOT NULL LIMIT 5'
            );
            console.log('Examples with score:', examples);
        }

        // Check if manual exams exist (exams without questions)
        const [manualExams] = await pool.execute<RowDataPacket[]>(
            `SELECT e.id, e.title 
             FROM exams e 
             LEFT JOIN exam_questions eq ON e.id = eq.exam_id 
             WHERE eq.id IS NULL
             LIMIT 5`
        );
        console.log('Manual Exams (no questions):', manualExams);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkScoreUsage();
