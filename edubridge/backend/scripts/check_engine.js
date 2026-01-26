const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

async function checkEngine() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(config);

        const [rows] = await connection.query(`
            SELECT TABLE_NAME, ENGINE 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('users', 'teachers', 'students', 'parents', 'classes', 'subjects')
        `, [config.database]);

        console.table(rows);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkEngine();
