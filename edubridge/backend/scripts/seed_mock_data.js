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

        // --- 0. Schema Repair (Classes) ---
        console.log('\n--- Schema Repair Skipped (Handled by fix_schema.js) ---');

        // --- 1. Create Teachers (Moved up to ensure teacher exists for classes) ---
        console.log('\n--- Creating Teachers ---');
        const subjects = ['Tamil', 'English', 'Science', 'History', 'Commerce'];
        const createdTeachers = []; // Store IDs

        for (let i = 1; i <= 5; i++) {
            const num = i.toString().padStart(2, '0');
            const email = `teacher${num}@gmail.com`;
            const name = `teacher${num}`;
            const subject = subjects[i - 1];

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
                userId = users[0].id; // This is user_id. We might need teacher_id? No, usually linked by user_id
                // console.log(`Teacher ${name} already exists`);
            }
            createdTeachers.push(userId);
        }
        const fallbackTeacherId = createdTeachers[0]; // Use first teacher for classes


        // --- 2. Ensure Classes Exist ---
        console.log('\n--- Ensuring Classes ---');
        const classesToEnsure = [
            { grade: 'Grade 4', section: 'B' },
            { grade: 'Grade 5', section: 'A' },
            { grade: 'Grade 10', section: 'A' },
            { grade: 'Grade 2', section: 'B' },
            { grade: 'Grade 5', section: 'C' }
        ];

        const classMap = {}; // grade-section -> id

        for (const cls of classesToEnsure) {
            // Use try-catch for safety
            try {
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
                    console.log(`Created Class ${cls.grade} ${cls.section} (ID: ${classId})`);
                } else {
                    classId = rows[0].id;
                    console.log(`Found Class ${cls.grade} ${cls.section} (ID: ${classId})`);
                }
                classMap[`${cls.grade}-${cls.section}`] = classId;
            } catch (err) {
                console.error(`Error processing class ${cls.grade} ${cls.section}:`, err.message);
            }
        }

        // --- 3. Create Parents ---
        console.log('\n--- Creating Parents ---');
        const createdParents = [];
        for (let i = 1; i <= 15; i++) {
            const num = i.toString().padStart(2, '0');
            const email = `parent${num}@gmail.com`;
            const name = `parent${num}`;
            const phone = `077${Math.floor(1000000 + Math.random() * 9000000)}`;

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
                // console.log(`Parent ${name} already exists`);
            }
            createdParents.push(userId);
        }


        // --- 4. Create Students ---
        console.log('\n--- Creating Students ---');
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

                        // Check if student record exists (by user_id)
                        const [st] = await connection.query('SELECT id FROM students WHERE user_id = ?', [userId]);
                        if (st.length === 0) {
                            await connection.query(
                                'INSERT INTO students (user_id, full_name, roll_number, class_id, parent_id, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)',
                                [userId, name, `${grade}-${section}-0${k + 1}`, classId, parentId, '2015-01-01']
                            );
                            console.log(`Created Student: ${name} (${grade} ${section}, Parent: ${parentId ? 'Allocated' : 'None'})`);
                        }
                    } else {
                        // console.log(`Student ${name} already exists`);
                    }
                } catch (err) {
                    console.error(`Error creating student ${name}:`, err.message);
                }
                studentCounter++;
            }
        }

        await createStudents(4, 'Grade 4', 'B');
        await createStudents(3, 'Grade 5', 'A');
        await createStudents(3, 'Grade 10', 'A');
        await createStudents(3, 'Grade 2', 'B');
        await createStudents(2, 'Grade 5', 'C', false); // Parent NULL

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    } finally {
        if (connection) connection.end();
    }
}

seedData();
