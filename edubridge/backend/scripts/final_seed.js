const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function seedData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        // --- 1. Teachers ---
        console.log('\n--- Teachers ---');
        const subjects = ['Tamil', 'English', 'Science', 'History', 'Commerce'];
        const createdTeachers = []; // IDs

        for (let i = 1; i <= 5; i++) {
            const num = i.toString().padStart(2, '0');
            const email = `teacher${num}@gmail.com`;
            const name = `teacher${num}`;
            const subject = subjects[i - 1];

            try {
                const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
                let userId;
                if (users.length === 0) {
                    const [res] = await connection.query(
                        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
                        [email, name, 'teacher']
                    );
                    userId = res.insertId;
                    await connection.query(
                        'INSERT INTO teachers (user_id, full_name, subject, qualification) VALUES (?, ?, ?, ?)',
                        [userId, name, subject, 'B.Ed']
                    );
                    console.log(`Created Teacher: ${name}`);
                } else {
                    userId = users[0].id; // Assumption: user exists = teacher exists
                    console.log(`Teacher ${name} exists`);
                }
                createdTeachers.push(userId);
            } catch (err) {
                console.error(`Error teacher ${name}: ${err.message}`);
            }
        }
        let fallbackTeacherId = createdTeachers[0];

        // Ensure fallback teacher in DB if needed (if createdTeachers empty due to errors)
        if (!fallbackTeacherId) {
            const [users] = await connection.query("SELECT id FROM users WHERE role='teacher' LIMIT 1");
            if (users.length > 0) fallbackTeacherId = users[0].id;
        }

        // --- 2. Classes ---
        console.log('\n--- Classes ---');
        const classesToEnsure = [
            { grade: 'Grade 4', section: 'B' },
            { grade: 'Grade 5', section: 'A' },
            { grade: 'Grade 10', section: 'A' },
            { grade: 'Grade 2', section: 'B' },
            { grade: 'Grade 5', section: 'C' }
        ];

        const classMap = {}; // grade-section -> id

        for (const cls of classesToEnsure) {
            try {
                // Verify column existence before querying if possible, but we did that in debug
                // Just run query
                const [rows] = await connection.query(
                    'SELECT id FROM classes WHERE grade = ? AND section = ?',
                    [cls.grade, cls.section]
                );

                let classId;
                if (rows.length === 0) {
                    const [result] = await connection.query(
                        'INSERT INTO classes (grade, section, class_teacher_id) VALUES (?, ?, ?)',
                        [cls.grade, cls.section, fallbackTeacherId]
                    );
                    classId = result.insertId;
                    console.log(`Created Class ${cls.grade} ${cls.section}`);
                } else {
                    classId = rows[0].id;
                    console.log(`Found Class ${cls.grade} ${cls.section}`);
                }
                classMap[`${cls.grade}-${cls.section}`] = classId;
            } catch (err) {
                console.error(`Error class ${cls.grade} ${cls.section}: ${err.message}`);
                // If unknown column, maybe try alternative insertion (unlikely needed if debug was correct)
            }
        }


        // --- 3. Parents ---
        console.log('\n--- Parents ---');
        const createdParents = [];
        for (let i = 1; i <= 15; i++) {
            const num = i.toString().padStart(2, '0');
            const email = `parent${num}@gmail.com`;
            const name = `parent${num}`;
            const phone = `077${Math.floor(1000000 + Math.random() * 9000000)}`;

            try {
                const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
                let userId;
                if (users.length === 0) {
                    const [res] = await connection.query(
                        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
                        [email, name, 'parent']
                    );
                    userId = res.insertId;
                    await connection.query(
                        'INSERT INTO parents (user_id, full_name, phone) VALUES (?, ?, ?)',
                        [userId, name, phone]
                    );
                    console.log(`Created Parent: ${name}`);
                } else {
                    userId = users[0].id;
                    console.log(`Parent ${name} exists`);
                }
                createdParents.push(userId);
            } catch (err) {
                console.error(`Error parent ${name}: ${err.message}`);
            }
        }


        // --- 4. Students ---
        console.log('\n--- Students ---');
        let studentCounter = 1;

        async function createStudents(count, grade, section, assignParent = true) {
            const classKey = `${grade}-${section}`;
            const classId = classMap[classKey];

            if (!classId) {
                console.log(`Skipping students for ${grade} ${section} (Class not found)`);
                return;
            }

            for (let k = 0; k < count; k++) {
                const num = studentCounter.toString().padStart(2, '0');
                const name = `student${num}`;
                const email = `student${num}@gmail.com`;

                let parentId = null;
                if (assignParent && createdParents.length > 0) {
                    parentId = createdParents[(studentCounter - 1) % createdParents.length];
                }

                try {
                    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
                    if (users.length === 0) {
                        const [res] = await connection.query(
                            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
                            [email, name, 'student']
                        );
                        const userId = res.insertId;

                        await connection.query(
                            'INSERT INTO students (user_id, full_name, roll_number, class_id, parent_id, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)',
                            [userId, name, `${grade}-${section}-0${k + 1}`, classId, parentId, '2015-01-01']
                        );
                        console.log(`Created Student: ${name} (${grade} ${section})`);
                    } else {
                        console.log(`Student ${name} exists`);
                    }
                } catch (err) {
                    console.error(`Error student ${name}: ${err.message}`);
                }
                studentCounter++;
            }
        }

        await createStudents(4, 'Grade 4', 'B');
        await createStudents(3, 'Grade 5', 'A');
        await createStudents(3, 'Grade 10', 'A');
        await createStudents(3, 'Grade 2', 'B');
        await createStudents(2, 'Grade 5', 'C', false);

    } catch (e) {
        console.error('CRITICAL:', e);
    } finally {
        if (connection) connection.end();
    }
}

seedData();
