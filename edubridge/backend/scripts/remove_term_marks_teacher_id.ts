
import { pool } from '../src/config/database';

async function migrate() {
    console.log('Starting migration: remove teacher_id from term_marks...');

    try {
        const connection = await pool.getConnection();

        // Check if column exists
        const [columns]: any = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'term_marks' 
            AND COLUMN_NAME = 'teacher_id'
        `);

        if (columns.length === 0) {
            console.log('Column teacher_id does not exist in term_marks. Skipping.');
            connection.release();
            process.exit(0);
        }

        console.log('Found teacher_id column. Checking for foreign keys...');

        // Check for foreign keys on teacher_id
        const [fks]: any = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'term_marks' 
            AND COLUMN_NAME = 'teacher_id' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        for (const fk of fks) {
            console.log(`Dropping foreign key: ${fk.CONSTRAINT_NAME}`);
            await connection.query(`ALTER TABLE term_marks DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        }

        console.log('Dropping teacher_id column...');
        await connection.query('ALTER TABLE term_marks DROP COLUMN teacher_id');

        console.log('Migration completed successfully.');
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
