
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migratePortfolios() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Starting migration...');

        // 1. Add temporary column for new teacher_id
        console.log('Adding temp_teacher_id column...');
        await connection.query('ALTER TABLE portfolios ADD COLUMN temp_teacher_id INT');

        // 2. Populate temp_teacher_id mapping users(id) -> teachers(id)
        console.log('Mapping teacher IDs...');
        await connection.query(`
            UPDATE portfolios p
            JOIN teachers t ON p.teacher_id = t.user_id
            SET p.temp_teacher_id = t.id
        `);

        // 3. Drop old teacher_id column
        console.log('Dropping old teacher_id column...');
        // We need to check if there is a foreign key constraint to drop first, although SHOW CREATE TABLE didn't show one for teacher_id, only student_id.
        // If there was one, we'd need to drop it.
        // Based on previous inspections, teacher_id didn't have a FK constraint in the CREATE TABLE output for 'portfolios'.
        await connection.query('ALTER TABLE portfolios DROP COLUMN teacher_id');

        // 4. Rename temp_teacher_id to teacher_id
        console.log('Renaming temp_teacher_id to teacher_id...');
        await connection.query('ALTER TABLE portfolios CHANGE COLUMN temp_teacher_id teacher_id INT');

        // 5. Add Foreign Key constraint
        console.log('Adding Foreign Key constraint...');
        await connection.query('ALTER TABLE portfolios ADD CONSTRAINT fk_portfolios_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)');

        // 6. Rename teacher_remarks to discipline_remarks
        console.log('Renaming teacher_remarks to discipline_remarks...');
        await connection.query('ALTER TABLE portfolios CHANGE COLUMN teacher_remarks discipline_remarks TEXT');

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migratePortfolios();
