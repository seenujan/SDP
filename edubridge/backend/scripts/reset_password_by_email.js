const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const targetEmail = 'depote1928@1200b.com';
const newPasswordPlain = 'password123';

async function resetPassword() {
    console.log(`Resetting password for: ${targetEmail}`);
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // 1. Find user
        const [users] = await pool.query('SELECT id, email, role, active FROM users WHERE email = ?', [targetEmail]);

        if (users.length === 0) {
            console.error(`❌ User with email ${targetEmail} not found.`);
            return;
        }

        const user = users[0];
        console.log('Found User:', user);

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);

        // 3. Update DB
        await pool.query('UPDATE users SET password = ?, active = 1 WHERE id = ?', [hashedPassword, user.id]);
        console.log(`✅ Password updated to '${newPasswordPlain}' and account activated.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

resetPassword();
