const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function migrateExams() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // 1. Add new columns
        console.log('Adding new columns (class_id, subject_id)...');
        try {
            await connection.query(`ALTER TABLE exams ADD COLUMN class_id INT, ADD COLUMN subject_id INT`);
        } catch (e) {
            console.log('Columns likely exist, proceeding...');
        }

        // 2. Fetch all exams
        const [exams] = await connection.query(`SELECT * FROM exams`);
        console.log(`Found ${exams.length} exams to migrate.`);

        for (const exam of exams) {
            // Find Class ID
            if (exam.grade && exam.section) {
                const [classes] = await connection.query(
                    `SELECT id FROM classes WHERE grade = ? AND section = ?`,
                    [exam.grade, exam.section]
                );

                if (classes.length > 0) {
                    await connection.query(`UPDATE exams SET class_id = ? WHERE id = ?`, [classes[0].id, exam.id]);
                } else {
                    console.warn(`Class not found for Exam ${exam.id} (${exam.grade} - ${exam.section})`);
                }
            }

            // Find Subject ID
            if (exam.subject) {
                // Try exact match first
                let [subjects] = await connection.query(
                    `SELECT id FROM subjects WHERE subject_name = ?`,
                    [exam.subject]
                );

                if (subjects.length === 0) {
                    // Try to insert if not exists (Auto-create subject from legacy text)
                    console.log(`Subject '${exam.subject}' not found, creating...`);
                    const [res] = await connection.query(`INSERT INTO subjects (subject_name) VALUES (?)`, [exam.subject]);
                    await connection.query(`UPDATE exams SET subject_id = ? WHERE id = ?`, [res.insertId, exam.id]);
                } else {
                    await connection.query(`UPDATE exams SET subject_id = ? WHERE id = ?`, [subjects[0].id, exam.id]);
                }
            }
        }

        console.log('Data migration complete.');

        // 3. Alter columns to NOT NULL and Drop old columns
        console.log('Dropping old columns and enforcing constraints...');

        // We need to delete exams that didn't get migrated (orphaned data) to avoid NOT NULL errors, 
        // or we handle them gracefully. For now, strict cleanup.
        await connection.query(`DELETE FROM exams WHERE class_id IS NULL OR subject_id IS NULL`);

        await connection.query(`ALTER TABLE exams 
            MODIFY COLUMN class_id INT NOT NULL,
            MODIFY COLUMN subject_id INT NOT NULL,
            ADD CONSTRAINT fk_exams_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            ADD CONSTRAINT fk_exams_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        `);

        await connection.query(`ALTER TABLE exams 
            DROP COLUMN grade,
            DROP COLUMN section,
            DROP COLUMN subject
        `);

        console.log('Schema migration complete!');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateExams();
