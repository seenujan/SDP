
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function checkNotifications() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('--- Checking notifications table ---');
        const [rows] = await connection.query("SHOW COLUMNS FROM notifications");
        console.log(rows.map(row => `${row.Field} (${row.Type})`));
    } catch (err) {
        console.error('Error checking notifications table:', err.message);
    } finally {
        await connection.end();
    }
}

checkNotifications();
