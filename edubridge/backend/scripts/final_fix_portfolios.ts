
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function finalFix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Starting final fix...');

        const [rows] = await connection.query('SHOW COLUMNS FROM portfolios');
        const columns = (rows as any[]).map(r => r.Field);

        // 1. Rename teacher_remarks if exists
        if (columns.includes('teacher_remarks')) {
            if (!columns.includes('discipline_remarks')) {
                console.log('Renaming teacher_remarks to discipline_remarks...');
                await connection.query('ALTER TABLE portfolios CHANGE COLUMN teacher_remarks discipline_remarks TEXT');
            } else {
                console.log('Both columns exist? Dropping teacher_remarks...');
                // Copy data?
                await connection.query('UPDATE portfolios SET discipline_remarks = teacher_remarks WHERE discipline_remarks IS NULL');
                await connection.query('ALTER TABLE portfolios DROP COLUMN teacher_remarks');
            }
        }

        // 2. Drop temp_teacher_id if exists (assuming migration done)
        if (columns.includes('temp_teacher_id')) {
            console.log('Dropping temp_teacher_id...');
            await connection.query('ALTER TABLE portfolios DROP COLUMN temp_teacher_id');
        }

        console.log('Final fix completed.');

    } catch (error) {
        console.error('Final fix failed:', error);
    } finally {
        await connection.end();
    }
}

finalFix();
