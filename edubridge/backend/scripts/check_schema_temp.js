
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:\\SDP\\edubridge\\backend\\.env' });

async function checkSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edubridge'
        });


        const [columns] = await connection.query('SHOW COLUMNS FROM student_exam_attempts');
        console.log('Columns in student_exam_attempts:');
        columns.forEach(c => console.log(c.Field));

        const [examsColumns] = await connection.query('SHOW COLUMNS FROM exams');
        console.log('Columns in exams:');
        examsColumns.forEach(c => console.log(c.Field));


        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
