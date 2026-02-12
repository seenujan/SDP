const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixPassword() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const userId = 104; // Targeting the specific recent user
        console.log(`Fixing password for User ID: ${userId}`);

        // 1. Check current state
        const [users] = await pool.query('SELECT id, email, password, active FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            console.log('User not found!');
            return;
        }
        console.log('Current User State:', users[0]);

        // 2. Hash 'password123'
        const newHash = await bcrypt.hash('password123', 10);
        console.log('New Hash generated:', newHash);

        // 3. Update DB
        await pool.query('UPDATE users SET password = ?, active = 1 WHERE id = ?', [newHash, userId]);
        console.log('Database updated successfully.');

        // 4. Verify
        const [updatedUsers] = await pool.query('SELECT id, email, password, active FROM users WHERE id = ?', [userId]);
        console.log('Updated User State:', updatedUsers[0]);

        const match = await bcrypt.compare('password123', updatedUsers[0].password);
        console.log(`Verification: Matches 'password123'? ${match}`);

    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

fixPassword();
