const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

/*
    Migration Plan:
    1. Create table `subjects` if not exists.
    2. Populate `subjects` from existing distinct `assignments.subject`.
    3. Add `class_id`, `subject_id` columns to `assignments` (nullable first).
    4. Update `assignments.class_id` by matching `grade`, `section` with `classes` table.
    5. Update `assignments.subject_id` by matching `subject` with `subjects` table.
    6. (Optional) Make columns NOT NULL and add FKs.
    7. Drop old columns `grade`, `section`, `subject`.
*/

async function migrateAssignments() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // 1. Create subjects table
        console.log('Creating/Checking subjects table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_name VARCHAR(100) NOT NULL UNIQUE
            );
        `);

        // 2. Populate subjects
        console.log('Populating subjects from assignments...');
        // We get unique subjects from existing assignments
        const [rows] = await connection.query(`SELECT DISTINCT subject FROM assignments WHERE subject IS NOT NULL AND subject != ''`);

        for (const row of rows) {
            try {
                await connection.query(`INSERT IGNORE INTO subjects (subject_name) VALUES (?)`, [row.subject]);
            } catch (err) {
                console.log(`Skipping duplicate subject: ${row.subject}`);
            }
        }
        console.log(`Populated ${rows.length} subjects.`);

        // 3. Add new columns to assignments
        console.log('Adding class_id and subject_id to assignments...');
        // Check if columns exist first to avoid errors on re-run
        const [cols] = await connection.query(`SHOW COLUMNS FROM assignments LIKE 'class_id'`);
        if (cols.length === 0) {
            await connection.query(`ALTER TABLE assignments ADD COLUMN class_id INT, ADD COLUMN subject_id INT`);
        } else {
            console.log('Columns already exist.');
        }

        // 4. Update data
        console.log('Updating assignment data (Linking IDs)...');

        // Update class_id
        await connection.query(`
            UPDATE assignments a
            JOIN classes c ON a.grade = c.grade AND a.section = c.section
            SET a.class_id = c.id
            WHERE a.class_id IS NULL
        `);

        // Update subject_id
        await connection.query(`
            UPDATE assignments a
            JOIN subjects s ON a.subject = s.subject_name
            SET a.subject_id = s.id
            WHERE a.subject_id IS NULL
        `);

        console.log('Data migration complete.');

        // 5. Add FK constraints? 
        // We can do this only if all data is valid (i.e. no NULLs).
        // Let's check for NULLs
        const [invalidAssignments] = await connection.query(`SELECT count(*) as count FROM assignments WHERE class_id IS NULL OR subject_id IS NULL`);
        if (invalidAssignments[0].count > 0) {
            console.warn(`WARNING: ${invalidAssignments[0].count} assignments could not be mapped (invalid grade/section or subject). NOT dropping columns yet.`);
        } else {
            console.log('All assignments mapped successfully. Altering table...');

            // Drop FK if exists (hard to know name, usually auto-generated)
            // Skip precise FK management for this script unless strictly needed.
            // Just drop columns if we are sure.

            /* DANGEROUS: Dropping columns */
            try {
                await connection.query(`ALTER TABLE assignments DROP COLUMN grade`);
                await connection.query(`ALTER TABLE assignments DROP COLUMN section`);
                await connection.query(`ALTER TABLE assignments DROP COLUMN subject`);

                // Add Constraints
                await connection.query(`ALTER TABLE assignments MODIFY COLUMN class_id INT NOT NULL`);
                await connection.query(`ALTER TABLE assignments MODIFY COLUMN subject_id INT NOT NULL`);

                await connection.query(`ALTER TABLE assignments ADD CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE`);
                await connection.query(`ALTER TABLE assignments ADD CONSTRAINT fk_assignments_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE`);

                console.log('Columns dropped and FKs added.');
            } catch (e) {
                console.error('Error modifying table schema (maybe columns already dropped?):', e.message);
            }
        }

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateAssignments();
