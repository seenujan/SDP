const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixExamsSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Adding missing columns to exams table...');

        // Add section column
        await connection.execute(`
            ALTER TABLE exams 
            ADD COLUMN section VARCHAR(10) AFTER grade
        `);
        console.log('✓ Added section column');

        // Add teacher_id column
        await connection.execute(`
            ALTER TABLE exams 
            ADD COLUMN teacher_id INT NOT NULL AFTER grade
        `);
        console.log('✓ Added teacher_id column');

        // Add total_marks column
        await connection.execute(`
            ALTER TABLE exams 
            ADD COLUMN total_marks INT DEFAULT 0 AFTER duration
        `);
        console.log('✓ Added total_marks column');

        // Add status column
        await connection.execute(`
            ALTER TABLE exams 
            ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'draft' AFTER total_marks
        `);
        console.log('✓ Added status column');

        // Verify the schema
        const [columns] = await connection.execute('SHOW COLUMNS FROM exams');
        console.log('\n✓ Updated exams table columns:');
        columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

    } catch (error) {
        console.error('Error updating schema:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

fixExamsSchema()
    .then(() => {
        console.log('\n✓ Schema update completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Schema update failed:', error);
        process.exit(1);
    });
