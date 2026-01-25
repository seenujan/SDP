const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function debugDashboard() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const email = 'teacher01@gmail.com';
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            console.log('User not found!');
            return;
        }

        const user = users[0];
        console.log(`User: ${user.email}, ID: ${user.id}, Role: ${user.role}`);

        const teacherId = user.id;

        // 1. My Classes
        const [classCount] = await connection.query(
            'SELECT COUNT(DISTINCT class_id) as count FROM timetable WHERE teacher_id = ?',
            [teacherId]
        );
        console.log(`My Classes Count: ${classCount[0].count}`);

        // Show raw timetable entries
        const [timetable] = await connection.query('SELECT * FROM timetable WHERE teacher_id = ?', [teacherId]);
        console.log(`Timetable entries: ${timetable.length}`);
        timetable.forEach(t => console.log(` - ${t.day_of_week} ${t.start_time}: ${t.subject} (Class ${t.class_id})`));

        // 2. Pending Activity (PTM)
        const [ptmRequests] = await connection.query(
            'SELECT * FROM ptm_meetings WHERE teacher_id = ?',
            [teacherId]
        );
        console.log(`PTM Requests: ${ptmRequests.length}`);
        ptmRequests.forEach(p => console.log(` - ID ${p.id} Status: ${p.status}`));

        // 3. Check for Monday fallback need
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];
        console.log(`Today is: ${todayName}`);

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

debugDashboard();
