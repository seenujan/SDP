const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function checkTable() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const [tables] = await connection.query("SHOW TABLES LIKE 'notifications'");
        if (tables.length === 0) {
            console.log('❌ Notifications table DOES NOT exist!');
        } else {
            console.log('✅ Notifications table exists.');
            const [columns] = await connection.query("SHOW COLUMNS FROM notifications");
            console.log('Columns:', columns.map(c => c.Field).join(', '));
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

checkTable();
