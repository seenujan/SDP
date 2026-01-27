
import { pool } from '../src/config/database';

async function removeScoreColumn() {
    const connection = await pool.getConnection();
    try {
        console.log('Starting migration: remove score from student_exam_attempts');

        await connection.beginTransaction();

        // Check if column exists
        const [columns] = await connection.execute<any[]>(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'student_exam_attempts' 
             AND COLUMN_NAME = 'score'`
        );

        if (columns.length > 0) {
            console.log('Dropping score column...');
            await connection.execute(
                'ALTER TABLE student_exam_attempts DROP COLUMN score'
            );
            console.log('Column dropped successfully.');
        } else {
            console.log('Column score does not exist, skipping.');
        }

        await connection.commit();
        console.log('Migration completed successfully');
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

removeScoreColumn();
