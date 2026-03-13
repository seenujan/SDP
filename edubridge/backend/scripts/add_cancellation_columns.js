const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'school_management_system',
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Check if column exists
        const [columns] = await connection.execute("SHOW COLUMNS FROM teacher_leaves LIKE 'cancelled_by'");

        if (columns.length === 0) {
            console.log('Adding cancelled_by and cancellation_reason columns...');
            await connection.execute(`
                ALTER TABLE teacher_leaves 
                ADD COLUMN cancelled_by INT NULL DEFAULT NULL AFTER status,
                ADD COLUMN cancellation_reason TEXT NULL DEFAULT NULL AFTER cancelled_by,
                ADD CONSTRAINT fk_teacher_leaves_cancelled_by
                FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
            `);
            console.log('Columns added successfully.');
        } else {
            console.log('Columns already exist. Skipping.');
        }

    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
