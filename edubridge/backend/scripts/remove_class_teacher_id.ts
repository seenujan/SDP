
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function removeClassTeacherId() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Removing class_teacher_id from classes...');

        // Check if column exists
        const [columns]: any = await connection.query("SHOW COLUMNS FROM classes LIKE 'class_teacher_id'");

        if (columns.length > 0) {
            // Drop FK if exists (it might have a constraint)
            // We'll try to drop any potential FKs first effectively by checking constraints
            // But let's just try dropping the column, MySQL usually complains if FK exists.

            // Try to find FK name if we want to be safe, or just try dropping column.

            // Let's look for FKs on this column
            const [fks]: any = await connection.query(`
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_NAME = 'classes' 
                AND COLUMN_NAME = 'class_teacher_id'
                AND TABLE_SCHEMA = '${process.env.DB_NAME || 'edubridge'}'
            `);

            for (const fk of fks) {
                console.log(`Dropping FK: ${fk.CONSTRAINT_NAME}`);
                await connection.query(`ALTER TABLE classes DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
            }

            await connection.query('ALTER TABLE classes DROP COLUMN class_teacher_id');
            console.log('Column dropped successfully.');
        } else {
            console.log('Column class_teacher_id does not exist.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

removeClassTeacherId();
