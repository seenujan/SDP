
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edubridge'
};

async function migrateTermMarksSubjectId() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // 1. Add subject_id column
        console.log('Adding subject_id column...');
        try {
            await connection.execute('ALTER TABLE term_marks ADD COLUMN subject_id INT');
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
            await connection.execute('ALTER TABLE term_marks ADD CONSTRAINT fk_term_marks_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('Foreign key already exists');
            } else {
                throw e;
            }
        }

        // 3. Populate subject_id
        console.log('Populating subject_id...');
        await connection.execute(`
            UPDATE term_marks tm
            JOIN subjects s ON tm.subject = s.subject_name
            SET tm.subject_id = s.id
        `);

        // Check for orphans
        const [orphans] = await connection.execute('SELECT id, subject FROM term_marks WHERE subject_id IS NULL AND subject IS NOT NULL');
        if (orphans.length > 0) {
            console.warn(`WARNING: Found ${orphans.length} term_marks entries with subjects that don't satisfy the foreign key:`);
            console.log(orphans);
            console.error('Aborting column drop due to unmatched subjects.');
            return;
        }

        // 4. Drop subject column
        console.log('Dropping subject column...');
        await connection.execute('ALTER TABLE term_marks DROP COLUMN subject');

        console.log('Term Marks migration complete');

    } catch (error) {
        console.error('Error migrating term_marks:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateTermMarksSubjectId();
