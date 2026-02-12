const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function debugAuth() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Recent Users ---');
        const [users] = await pool.query('SELECT id, email, role, password, active, created_at FROM users ORDER BY created_at DESC LIMIT 5');
        const bcrypt = require('bcryptjs');

        for (const u of users) {
            console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.active}`);
            console.log(`Hash: ${u.password}`);

            // Test 'password123'
            const match = await bcrypt.compare('password123', u.password);
            console.log(`Matches 'password123': ${match}`);
            console.log('---');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

debugAuth();
