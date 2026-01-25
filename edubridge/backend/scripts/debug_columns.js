const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function debug() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        // Force select * to see what we get
        // If table is empty, insert a dummy row via simplified query if possible, or just SHOW COLUMNS again but parse carefully
        const [cols] = await connection.query("SHOW COLUMNS FROM classes");
        console.log('--- Columns Raw ---');
        cols.forEach(c => console.log(`"${c.Field}"`)); // Quote to see spaces

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

debug();
