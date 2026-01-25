const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function debugPTM() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        // 1. Check PTM Meetings
        const [ptms] = await connection.query('SELECT * FROM ptm_meetings');
        console.log('\n=== PTM Meetings ===');
        console.log(ptms);

        if (ptms.length === 0) {
            console.log('No PTMs found.');
            return;
        }

        const sample = ptms[0];
        const teacherId = sample.teacher_id;
        const parentId = sample.parent_id;
        const studentId = sample.student_id;

        console.log(`\nChecking links for PTM ID ${sample.id}: Teacher ${teacherId}, Parent ${parentId}, Student ${studentId}`);

        // 2. Check Users
        const [users] = await connection.query('SELECT * FROM users WHERE id IN (?, ?)', [teacherId, parentId]);
        console.log('\n=== Users ===');
        console.log(users);

        // 3. Check Teacher Profile
        const [teachers] = await connection.query('SELECT * FROM teachers WHERE user_id = ?', [teacherId]);
        console.log('\n=== Teachers (Profile) ===');
        console.log(teachers);

        // 4. Check Parent Profile
        const [parents] = await connection.query('SELECT * FROM parents WHERE user_id = ?', [parentId]);
        console.log('\n=== Parents (Profile) ===');
        console.log(parents);

        // 5. Check Student
        const [students] = await connection.query('SELECT * FROM students WHERE id = ?', [studentId]);
        console.log('\n=== Student ===');
        console.log(students);

        if (students.length > 0) {
            const classId = students[0].class_id;
            // 6. Check Class
            const [classes] = await connection.query('SELECT * FROM classes WHERE id = ?', [classId]);
            console.log('\n=== Class ===');
            console.log(classes);
        }

        // 7. Test Teacher Query
        console.log('\n=== Testing Service Query (Teacher) ===');
        const teacherQuery = `
            SELECT ptm.*, 
                pr.full_name as parent_name,
                s.full_name as student_name,
                c.grade,
                c.section
            FROM ptm_meetings ptm
            LEFT JOIN users p ON ptm.parent_id = p.id
            LEFT JOIN parents pr ON ptm.parent_id = pr.user_id
            JOIN students s ON ptm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE ptm.teacher_id = ?
        `;
        const [tResults] = await connection.execute(teacherQuery, [teacherId]);
        console.log(`Rows found: ${tResults.length}`);
        if (tResults.length === 0) console.log('Teacher Query returned NO rows. Check JOINs.');

        // 8. Test Parent Query
        console.log('\n=== Testing Service Query (Parent) ===');
        const parentQuery = `
            SELECT ptm.*, 
                t.full_name as teacher_name,
                s.full_name as student_name,
                c.grade,
                c.section
            FROM ptm_meetings ptm
            JOIN teachers t ON ptm.teacher_id = t.user_id
            JOIN students s ON ptm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE ptm.parent_id = ?
        `;
        const [pResults] = await connection.execute(parentQuery, [parentId]);
        console.log(`Rows found: ${pResults.length}`);
        if (pResults.length === 0) console.log('Parent Query returned NO rows. Check JOINs.');

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

debugPTM();
