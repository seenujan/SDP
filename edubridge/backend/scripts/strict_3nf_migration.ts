import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

import { pool } from '../src/config/database';

async function migrate() {
    try {
        console.log('Starting Strict 3NF Migration...');

        // 1. Drop online_exam_marks table
        console.log('Dropping table online_exam_marks...');
        try {
            await pool.query('DROP TABLE IF EXISTS online_exam_marks');
            console.log('✅ Table dropped.');
        } catch (e: any) {
            console.log('⚠️ Error dropping table (might not exist):', e.message);
        }

        // 2. Drop total_score column from student_exam_attempts
        console.log('Dropping column total_score from student_exam_attempts...');

        // Check if exists first
        const [columns]: any = await pool.query("SHOW COLUMNS FROM student_exam_attempts LIKE 'total_score'");
        if (columns.length > 0) {
            await pool.query('ALTER TABLE student_exam_attempts DROP COLUMN total_score');
            console.log('✅ Column dropped.');
        } else {
            console.log('ℹ️ Column total_score already removed.');
        }

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await pool.end();
    }
}

migrate();
