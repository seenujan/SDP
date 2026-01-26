const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function migrateTeachers() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // 1. Add subject_id column
        console.log('Adding subject_id column...');
        try {
            await connection.query('ALTER TABLE teachers ADD COLUMN subject_id INT');
        } catch (e) {
            // Ignore if exists
            if (!e.message.includes('Duplicate column')) throw e;
        }

        // 2. Get all teachers
        const [teachers] = await connection.query('SELECT * FROM teachers');

        // 3. Get all subjects
        const [subjects] = await connection.query('SELECT * FROM subjects');

        // Map subject name (lower) to id
        const subjectMap = new Map();
        subjects.forEach(s => subjectMap.set(s.subject_name.toLowerCase(), s.id));

        console.log('Updating teachers...');
        for (const teacher of teachers) {
            if (teacher.subject) {
                const subName = teacher.subject.toLowerCase();
                const subId = subjectMap.get(subName);

                if (subId) {
                    await connection.query('UPDATE teachers SET subject_id = ? WHERE id = ?', [subId, teacher.id]);
                    console.log(`Updated teacher ${teacher.full_name}: ${teacher.subject} -> ${subId}`);
                } else {
                    console.warn(`Subject not found for teacher ${teacher.full_name}: ${teacher.subject}`);
                }
            }
        }

        // 4. Add FK constraint
        console.log('Adding Foreign Key constraint...');
        await connection.query('ALTER TABLE teachers ADD CONSTRAINT fk_teacher_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL');

        // 5. Drop old subject column (optional, safe to keep for backup, but user asked to replace)
        console.log('Dropping old subject column...');
        await connection.query('ALTER TABLE teachers DROP COLUMN subject');

        console.log('Migration complete.');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateTeachers();
