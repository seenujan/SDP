
import { pool } from '../src/config/database';

async function updateSchema() {
    try {
        console.log('Adding section column to exams table...');

        // Check if column exists
        const [columns]: any = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'school_management_system' 
            AND TABLE_NAME = 'exams' 
            AND COLUMN_NAME = 'section'
        `);

        if (columns.length === 0) {
            await pool.query('ALTER TABLE exams ADD COLUMN section VARCHAR(10) AFTER grade');
            console.log('Successfully added section column to exams table.');
        } else {
            console.log('Section column already exists in exams table.');
        }

    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        process.exit();
    }
}

updateSchema();
