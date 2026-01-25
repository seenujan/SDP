const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '#Seenu2003',
    database: process.env.DB_NAME || 'school_management'
};

async function checkPasswordNullable() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [columns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'password'`);
        console.log('Password column:', columns[0]);
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

checkPasswordNullable();
