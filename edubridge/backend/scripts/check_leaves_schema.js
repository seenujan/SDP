const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'school_management_system',
};

const fs = require('fs');
async function checkSchema() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('DESCRIBE teacher_leaves');
        fs.writeFileSync('schema_output.txt', JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (error) {
        fs.writeFileSync('schema_output.txt', 'Error: ' + error.message);
    }
}

checkSchema();
