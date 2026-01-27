
import { pool } from '../src/config/database';

async function migrate() {
    console.log('Starting migration: remove total_marks from exams...');

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

        if (columns.length === 0) {
            console.log('Column total_marks does not exist in exams. Skipping.');
            connection.release();
            process.exit(0);
        }

        console.log('Dropping total_marks column...');
        await connection.query('ALTER TABLE exams DROP COLUMN total_marks');

        console.log('Migration completed successfully.');
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
