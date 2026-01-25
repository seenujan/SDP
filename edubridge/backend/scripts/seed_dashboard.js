const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function seedRealDashboardData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        // 1. Get Teacher ID (using teacher01)
        const [users] = await connection.query('SELECT id FROM users WHERE email = ?', ['teacher01@gmail.com']);
        if (users.length === 0) throw new Error('Teacher 01 not found');
        const userId = users[0].id; // this is user_id
        // Get teacher_id from teachers table?? No, controllers usually use user_id as teacher_id context often, or join. 
        // Wait, schema: timetable uses teacher_id but it refs users(id)?
        // Schema check: FOREIGN KEY (teacher_id) REFERENCES users(id) -- YES.
        const teacherId = userId;
        console.log(`Using Teacher ID: ${teacherId}`);

        // 2. Insert Timetable for TODAY (or Monday if weekend, to suffice DB constraint)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let today = days[new Date().getDay()];

        // Fix: DB Enum only has Monday-Friday. If Sat/Sun, force Monday for testing.
        if (today === 'Saturday' || today === 'Sunday') {
            console.log('Today is weekend, using Monday for seed compatibility');
            today = 'Monday';
        }

        console.log(`Inserting timetable for: ${today}`);

        // Get a class ID
        const [classes] = await connection.query('SELECT id FROM classes LIMIT 1');
        const classId = classes[0].id;

        await connection.query('DELETE FROM timetable WHERE teacher_id = ? AND day_of_week = ?', [teacherId, today]);
        await connection.query(`
            INSERT INTO timetable (class_id, subject, day_of_week, start_time, end_time, teacher_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [classId, 'Mathematics', today, '09:00:00', '10:00:00', teacherId]);
        console.log('Inserted Timetable Entry');

        // 3. Insert PTM Request (Recent Activity)
        // Get a student
        const [students] = await connection.query('SELECT id, parent_id FROM students WHERE parent_id IS NOT NULL LIMIT 1');
        if (students.length > 0) {
            const student = students[0];
            await connection.query(`
                INSERT INTO ptm_meetings (student_id, teacher_id, parent_id, meeting_date, meeting_time, status, created_at)
                VALUES (?, ?, ?, CURDATE() + INTERVAL 2 DAY, '10:00', 'pending', NOW())
            `, [student.id, teacherId, student.parent_id]);
            console.log('Inserted PTM Request');
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

seedRealDashboardData();
