const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function fixTeacherData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const email = 'teacher01@gmail.com';
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return console.log('User not found');
        const teacherId = users[0].id;
        console.log(`Teacher ID: ${teacherId}`);

        // 1. Ensure 4 classes are assigned in Timetable
        // First, check existing
        const [existing] = await connection.query('SELECT DISTINCT class_id FROM timetable WHERE teacher_id = ?', [teacherId]);
        let currentClassIds = existing.map(e => e.class_id);
        console.log(`Current assigned classes: ${currentClassIds.join(', ')}`);

        // Get 3 other random classes (excluding current ones)
        let query = 'SELECT id FROM classes WHERE id NOT IN (?) LIMIT 3';
        if (currentClassIds.length === 0) query = 'SELECT id FROM classes LIMIT 4';

        let params = [currentClassIds.length > 0 ? currentClassIds : 0]; // 0 is dummy if empty

        const [moreClasses] = await connection.query(`SELECT id, grade, section FROM classes WHERE id NOT IN (?) LIMIT 4`, [currentClassIds.length > 0 ? currentClassIds : [-1]]);

        // We need 4 total. If we have 1, we add 3.
        const needed = 4 - currentClassIds.length;
        if (needed > 0) {
            console.log(`Assigning ${needed} more classes...`);
            const classesToAdd = moreClasses.slice(0, needed);

            for (const cls of classesToAdd) {
                console.log(` - Assigning ${cls.grade} ${cls.section} (ID: ${cls.id})`);
                // Insert into timetable (Morning slot, Monday)
                await connection.query(`
                    INSERT INTO timetable (class_id, subject, day_of_week, start_time, end_time, teacher_id)
                    VALUES (?, 'Mathematics', 'Monday', '10:00:00', '11:00:00', ?)
                `, [cls.id, teacherId]);
                currentClassIds.push(cls.id);
            }
        }

        // 2. Ensure students exist in ALL assigned classes
        console.log('Verifying student counts...');
        for (const classId of currentClassIds) {
            const [rows] = await connection.query('SELECT COUNT(*) as count FROM students WHERE class_id = ?', [classId]);
            const count = rows[0].count;
            console.log(`Class ${classId}: ${count} students`);

            if (count === 0) {
                console.log(` - Seeding 5 students for Class ${classId}...`);
                // Get a parent ID to link (or multiple)
                const [parents] = await connection.query('SELECT id FROM users WHERE role="parent" LIMIT 1');
                const parentId = parents[0].id; // Just use first parent for speed

                for (let i = 1; i <= 5; i++) {
                    const studentEmail = `student_${classId}_${i}@test.com`;
                    // Create user first if not exists (mock)
                    // Simplified: Just insert into students directly? 
                    // No, students table refs users.
                    // Let's create user
                    const [uRes] = await connection.query('INSERT INTO users (email, password, role) VALUES (?, ?, "student")', [studentEmail, 'password']);
                    const studentUserId = uRes.insertId;

                    await connection.query(`
                        INSERT INTO students (user_id, full_name, class_id, parent_id, roll_number)
                        VALUES (?, ?, ?, ?, ?)
                    `, [studentUserId, `Student ${classId}-${i}`, classId, parentId, `R-${classId}-${i}`]);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

fixTeacherData();
