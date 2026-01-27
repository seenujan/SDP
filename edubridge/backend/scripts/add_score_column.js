
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:\\SDP\\edubridge\\backend\\.env' });

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edubridge'
        });

        // Check if column exists first to avoid error
        const [columns] = await connection.query('SHOW COLUMNS FROM student_exam_attempts LIKE "score"');
        if (columns.length === 0) {
            console.log('Adding score column to student_exam_attempts...');
            await connection.query('ALTER TABLE student_exam_attempts ADD COLUMN score DECIMAL(5,2) DEFAULT NULL');
            console.log('Column added successfully.');
        } else {
            console.log('Column score already exists.');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

migrate();
