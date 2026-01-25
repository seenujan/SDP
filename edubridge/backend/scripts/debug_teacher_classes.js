const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function debugTeacherClasses() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const email = 'teacher01@gmail.com';
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return console.log('User not found');

        const teacherId = users[0].id; // user_id
        console.log(`Teacher ID: ${teacherId}`);

        // 1. Get Distinct Classes from Timetable
        const [classes] = await connection.query(`
            SELECT DISTINCT c.id, c.grade, c.section
            FROM timetable t
            JOIN classes c ON t.class_id = c.id
            WHERE t.teacher_id = ?
        `, [teacherId]);

        console.log(`\nTeacher is assigned to ${classes.length} distinct classes in Timetable:`);

        for (const cls of classes) {
            // 2. Count students in each class
            const [students] = await connection.query('SELECT COUNT(*) as count FROM students WHERE class_id = ?', [cls.id]);
            const count = students[0].count;
            console.log(` - Class ID ${cls.id}: ${cls.grade} ${cls.section} has ${count} students`);

            // List students for verification
            if (count === 0) {
                const [allStudentsInThisClass] = await connection.query('SELECT * FROM students WHERE class_id = ?', [cls.id]);
                console.log(`   (Double check: Found ${allStudentsInThisClass.length} rows directly in students table)`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

debugTeacherClasses();
