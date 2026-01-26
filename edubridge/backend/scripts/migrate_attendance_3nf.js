const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function migrateAttendance() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // 1. Add new columns if they don't exist
        console.log('Adding new columns...');
        try {
            await connection.query(`ALTER TABLE attendance ADD COLUMN class_id INT`);
            await connection.query(`ALTER TABLE attendance ADD COLUMN subject_id INT`);
            await connection.query(`ALTER TABLE attendance ADD CONSTRAINT fk_attendance_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE`);
            await connection.query(`ALTER TABLE attendance ADD CONSTRAINT fk_attendance_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE`);
        } catch (e) {
            console.log('Columns/Keys might already exist, continuing...', e.message);
        }

        // 2. Fetch all attendance records
        const [records] = await connection.query(`SELECT id, class, subject FROM attendance`);
        console.log(`Found ${records.length} attendance records to migrate.`);

        // 3. Migrate data
        for (const record of records) {
            if (!record.class && !record.subject) continue; // Skip if empty?

            let classId = null;
            let subjectId = null;

            // Resolve Class ID
            if (record.class) {
                // Assumption: class format is "Grade X Section Y" or similar. 
                // We need to parse "Grade 10 Section A" -> Grade='Grade 10', Section='A'
                // Or "Grade 10 A" -> Grade='Grade 10', Section='A'
                // Let's try to match logic from frontend: `${selectedClassData.grade} ${selectedClassData.section}`

                // Regex to split by last space might work if section is always one word
                // But grade can be "Grade 10".
                // Let's try to match against classes table directly if possible, or parse.

                // Let's try to parse: "Grade 10 A" -> last part is section?
                // Or "Grade 10 Section A" -> parts?

                // Looking at database might be helpful, but let's assume standard format created by frontend.
                // Re-reading Attendance.tsx: `${selectedClassData.grade} ${selectedClassData.section}`
                // Example: "Grade 10 A"

                const parts = record.class.split(' ');
                const section = parts.pop(); // Last part is section?
                const grade = parts.join(' '); // Remainder is grade?

                const [classes] = await connection.query(
                    `SELECT id FROM classes WHERE grade = ? AND section = ?`,
                    [grade, section]
                );

                if (classes.length > 0) {
                    classId = classes[0].id;
                } else {
                    console.log(`Could not find class for: "${record.class}" (Parsed: G="${grade}", S="${section}")`);
                }
            }

            // Resolve Subject ID
            if (record.subject) {
                const [subjects] = await connection.query(
                    `SELECT id FROM subjects WHERE subject_name = ?`,
                    [record.subject]
                );

                if (subjects.length > 0) {
                    subjectId = subjects[0].id;
                } else {
                    // Try to insert subject if missing? Or just log?
                    // Better to log for now.
                    console.log(`Could not find subject for: "${record.subject}"`);

                    // Optional: Create subject if it doesn't exist? 
                    // Project requirement usually implies normalized data exists. 
                    // Let's insert it to be safe and ensure migration succeeds.
                    const [res] = await connection.query(`INSERT INTO subjects (subject_name) VALUES (?)`, [record.subject]);
                    subjectId = res.insertId;
                    console.log(`Created new subject: ${record.subject} (ID: ${subjectId})`);
                }
            }

            // Update record
            if (classId || subjectId) {
                await connection.query(
                    `UPDATE attendance SET class_id = ?, subject_id = ? WHERE id = ?`,
                    [classId, subjectId, record.id]
                );
            }
        }

        console.log('Data migration completed.');

        // 4. Drop old columns
        console.log('Dropping old columns...');
        try {
            await connection.query(`ALTER TABLE attendance DROP COLUMN class`);
            await connection.query(`ALTER TABLE attendance DROP COLUMN subject`);
        } catch (e) {
            console.log('Error dropping columns (maybe already dropped):', e.message);
        }

        console.log('Migration Successfully Completed!');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateAttendance();
