const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function addTeacherPhone() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        // Check if column exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'phone'
        `, [dbConfig.database]);

        if (columns.length === 0) {
            console.log('Adding phone column to teachers table...');
            await connection.query('ALTER TABLE teachers ADD COLUMN phone VARCHAR(20) NULL DEFAULT NULL');
            console.log('Column added successfully.');
        } else {
            console.log('Column phone already exists in teachers table.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

addTeacherPhone();
