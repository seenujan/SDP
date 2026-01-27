
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspect() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        const [rows] = await connection.query('DESCRIBE portfolios');
        console.table(rows);
    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
}

inspect();
