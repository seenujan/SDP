const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function checkSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const [rows] = await connection.query("SHOW CREATE TABLE classes");
        console.log('\n--- Classes Table Schema ---');
        console.log(rows[0]['Create Table']);

        const [rows2] = await connection.query("SHOW CREATE TABLE students");
        console.log('\n--- Students Table Schema ---');
        console.log(rows2[0]['Create Table']);

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

checkSchema();
