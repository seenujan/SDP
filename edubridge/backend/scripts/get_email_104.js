const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function getEmail() {
    console.log('Connecting...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await pool.query('SELECT email FROM users WHERE id = 104');
        console.log('EMAIL:', rows[0].email);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

getEmail();
