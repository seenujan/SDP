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

async function checkDB() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await mysql.createConnection(config);

        console.log('\n--- TRIGGERS ---');
        const [triggers] = await connection.query('SHOW TRIGGERS');
        console.table(triggers);

        console.log('\n--- USERS TABLE ---');
        const [users] = await connection.query('SHOW CREATE TABLE users');
        console.log(users[0]['Create Table']);

        console.log('\n--- TEACHERS TABLE ---');
        const [teachers] = await connection.query('SHOW CREATE TABLE teachers');
        console.log(teachers[0]['Create Table']);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkDB();
