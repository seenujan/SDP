const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function migrateSubmissions() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // Check if column exists
        const [cols] = await connection.query(`SHOW COLUMNS FROM assignment_submissions LIKE 'status'`);

        if (cols.length > 0) {
            console.log('Dropping status column from assignment_submissions...');
            await connection.query(`ALTER TABLE assignment_submissions DROP COLUMN status`);
            console.log('Column dropped successfully.');
        } else {
            console.log('Column "status" does not exist. Skipping.');
        }

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateSubmissions();
