const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '#Seenu2003',
    database: process.env.DB_NAME || 'school_management'
};

async function makePasswordNullable() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        console.log('Modifying password column to be nullable...');
        await connection.query('ALTER TABLE users MODIFY password VARCHAR(255) NULL');
        console.log('Password column modified successfully.');

    } catch (e) {
        console.error('Error modifying password column:', e);
    } finally {
        if (connection) connection.end();
    }
}

makePasswordNullable();
