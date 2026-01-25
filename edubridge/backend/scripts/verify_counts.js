const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function checkCounts() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const [rows] = await connection.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        console.log('\n--- User Counts ---');
        rows.forEach(r => console.log(`${r.role}: ${r.count}`));

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

checkCounts();
