import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

import { pool } from '../src/config/database';

async function migrate() {
    try {
        console.log('Starting Migration: Dropping columns from student_exam_answers...');

        // Check if columns exist first (optional, but good for safety)
        const [columns]: any = await pool.query(`SHOW COLUMNS FROM student_exam_answers LIKE 'is_correct'`);

        if (columns.length > 0) {
            await pool.query(`
                ALTER TABLE student_exam_answers 
                DROP COLUMN is_correct,
                DROP COLUMN marks_awarded;
            `);
            console.log('✅ Columns dropped successfully.');
        } else {
            console.log('ℹ️ Columns "is_correct" not found. Might have been dropped already.');
        }

        // Verify
        const [colsAfter]: any = await pool.query(`DESCRIBE student_exam_answers`);
        console.log('\nCurrent Schema for student_exam_answers:');
        colsAfter.forEach((col: any) => console.log(` - ${col.Field} (${col.Type})`));

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await pool.end();
    }
}

migrate();
