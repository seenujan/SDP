
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listFKs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        const [rows] = await connection.query(`
            SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'portfolios' AND TABLE_SCHEMA = '${process.env.DB_NAME || 'edubridge'}'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        console.table(rows);
    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
}

listFKs();
