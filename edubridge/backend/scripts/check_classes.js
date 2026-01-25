const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function checkColumns() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const [columns] = await connection.query("SHOW COLUMNS FROM classes");
        console.log('Classes Columns:', columns.map(c => c.Field).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

checkColumns();
