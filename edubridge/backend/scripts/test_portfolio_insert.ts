
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testInsert() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Testing insert...');

        // Find a valid teacher and student
        const [teachers]: any = await connection.query('SELECT id FROM teachers LIMIT 1');
        const [students]: any = await connection.query('SELECT id FROM students LIMIT 1');

        if (teachers.length === 0 || students.length === 0) {
            console.log('No teachers or students found.');
            return;
        }

        const teacherId = teachers[0].id;
        const studentId = students[0].id;

        console.log(`Using Teacher ID: ${teacherId}, Student ID: ${studentId}`);

        const query = `INSERT INTO portfolios 
            (student_id, teacher_id, performance_summary, activities_achievements, areas_improvement, discipline_remarks)
            VALUES (?, ?, ?, ?, ?, ?)`;

        const params = [
            studentId,
            teacherId,
            'Test Summary',
            'Test Activities',
            'Test Areas',
            'Test Remarks'
        ];

        const [result] = await connection.query(query, params);
        console.log('Insert successful:', result);

    } catch (e) {
        console.error('Insert failed:', e);
    } finally {
        await connection.end();
    }
}

testInsert();
