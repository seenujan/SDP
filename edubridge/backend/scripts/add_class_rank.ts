import { pool } from '../src/config/database';

async function migrate() {
    // Add class_rank column to students if it doesn't exist
    const [cols]: any = await pool.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'class_rank'
    `);

    if (cols.length === 0) {
        await pool.query(`ALTER TABLE students ADD COLUMN class_rank INT DEFAULT NULL`);
        console.log('✅ Added class_rank column to students table.');
    } else {
        console.log('ℹ️  class_rank column already exists, skipping.');
    }

    await pool.end();
}

migrate().catch(e => { console.error('Error:', e.message); process.exit(1); });
