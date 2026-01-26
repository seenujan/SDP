
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edubridge'
};

async function migrateTimetableSubjectId() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // 1. Add subject_id column
        console.log('Adding subject_id column...');
        try {
            await connection.execute('ALTER TABLE timetable ADD COLUMN subject_id INT');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('subject_id column already exists');
            } else {
                throw e;
            }
        }

        // 2. Add Foreign Key
        console.log('Adding Foreign Key...');
        try {
            await connection.execute('ALTER TABLE timetable ADD CONSTRAINT fk_timetable_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('Foreign key already exists');
            } else {
                throw e; // Might fail if data is inconsistent, but we just added the column so it's NULL
            }
        }

        // 3. Populate subject_id
        console.log('Populating subject_id...');
        await connection.execute(`
            UPDATE timetable t
            JOIN subjects s ON t.subject = s.subject_name
            SET t.subject_id = s.id
        `);

        // Check for any entries that weren't updated (meaning subject name didn't match)
        const [orphans] = await connection.execute('SELECT id, subject FROM timetable WHERE subject_id IS NULL AND subject IS NOT NULL');
        if (orphans.length > 0) {
            console.warn(`WARNING: Found ${orphans.length} timetable entries with subjects that don't satisfy the foreign key:`);
            console.log(orphans);
            // We won't drop the column if there are orphans, to prevent data loss.
            console.error('Aborting column drop due to unmatched subjects.');
            return;
        }

        // 4. Drop subject column
        console.log('Dropping subject column...');
        await connection.execute('ALTER TABLE timetable DROP COLUMN subject');

        console.log('Timetable migration complete');

    } catch (error) {
        console.error('Error migrating timetable:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateTimetableSubjectId();
