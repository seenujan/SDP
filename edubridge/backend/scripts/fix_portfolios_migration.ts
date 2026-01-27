
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Starting fix migration...');

        // Helper to check if column exists
        const columnExists = async (colName: string) => {
            const [rows] = await connection.query(`SHOW COLUMNS FROM portfolios LIKE '${colName}'`);
            return (rows as any[]).length > 0;
        };

        // 1. Check/Add temp_teacher_id
        if (!await columnExists('temp_teacher_id')) {
            console.log('Adding temp_teacher_id column...');
            await connection.query('ALTER TABLE portfolios ADD COLUMN temp_teacher_id INT');
        } else {
            console.log('temp_teacher_id already exists.');
        }

        // 2. Populate temp_teacher_id
        // We only do this if teacher_id exists (old column) AND temp_teacher_id exists
        if (await columnExists('teacher_id') && await columnExists('temp_teacher_id')) {
            // Check if teacher_id is the OLD one (references users) or NEW one (references teachers)
            // The old teacher_id was likely NOT a foreign key to teachers(id), but user_id.
            // But wait, if we already renamed temp_teacher_id to teacher_id, then teacher_id IS the new one.
            // How to distinguish?
            // The old teacher_id was likely larger or not matching teachers.id if they are different.
            // Safer check: If 'temp_teacher_id' exists, we assume we are in the middle of migration.

            console.log('Populating temp_teacher_id...');
            await connection.query(`
                UPDATE portfolios p
                JOIN teachers t ON p.teacher_id = t.user_id
                SET p.temp_teacher_id = t.id
                WHERE p.temp_teacher_id IS NULL
            `);
        }

        // 3. Drop old teacher_id
        if (await columnExists('teacher_id') && await columnExists('temp_teacher_id')) {
            console.log('Dropping old teacher_id...');
            // remove any potential FK first just in case
            try { await connection.query('ALTER TABLE portfolios DROP FOREIGN KEY portfolios_teacher_id_foreign'); } catch (e) { }
            try { await connection.query('ALTER TABLE portfolios DROP FOREIGN KEY portfolios_ibfk_1'); } catch (e) { }

            await connection.query('ALTER TABLE portfolios DROP COLUMN teacher_id');
        }

        // 4. Rename temp_teacher_id to teacher_id
        if (await columnExists('temp_teacher_id') && !await columnExists('teacher_id')) {
            console.log('Renaming temp_teacher_id to teacher_id...');
            await connection.query('ALTER TABLE portfolios CHANGE COLUMN temp_teacher_id teacher_id INT');
        }

        // 5. Add Foreign Key
        // Check if FK exists? tough to check simply, just try adding or ignore error
        console.log('Adding Foreign Key...');
        try {
            await connection.query('ALTER TABLE portfolios ADD CONSTRAINT fk_portfolios_teacher_v2 FOREIGN KEY (teacher_id) REFERENCES teachers(id)');
        } catch (e: any) {
            if (e.code === 'ER_DUP_KEY' || e.message.includes('Duplicate')) {
                console.log('Foreign key already exists.');
            } else {
                console.log('Error adding foreign key (might already exist):', e.message);
            }
        }

        // 6. Rename teacher_remarks
        if (await columnExists('teacher_remarks')) {
            console.log('Renaming teacher_remarks to discipline_remarks...');
            await connection.query('ALTER TABLE portfolios CHANGE COLUMN teacher_remarks discipline_remarks TEXT');
        } else {
            console.log('teacher_remarks column not found (already renamed?).');
        }

        console.log('Fix migration completed.');

    } catch (error) {
        console.error('Fix migration failed:', error);
    } finally {
        await connection.end();
    }
}

fixMigration();
