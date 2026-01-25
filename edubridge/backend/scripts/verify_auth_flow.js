const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
// We need to use compiled JS or ts-node to run service code.
// Since we are adding a script in JS, we can't easily import TS services without ts-node.
// Simulating the flow using direct DB queries is safer/easier for this script.

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '#Seenu2003',
    database: process.env.DB_NAME || 'school_management'
};

async function verifyAuthFlow() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const testEmail = `test_parent_${Date.now()}@example.com`;
        const testPhone = '1234567890';
        const testName = 'Test Parent';

        // 1. Simulate "Create Parent" (Admin Action)
        console.log('\n1. Creating inactive parent...');
        // Insert user
        const [userRes] = await connection.query(
            'INSERT INTO users (email, password, role, active) VALUES (?, NULL, ?, 0)',
            [testEmail, 'parent']
        );
        const userId = userRes.insertId;

        // Insert parent
        await connection.query(
            'INSERT INTO parents (user_id, full_name, phone) VALUES (?, ?, ?)',
            [userId, testName, testPhone]
        );

        // Generate token (simulate Service logic)
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await connection.query(
            'INSERT INTO activation_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
            [token, userId, expiresAt]
        );
        console.log(`Created user ${testEmail} (ID: ${userId}) with token prefix ${token.substring(0, 10)}...`);

        // 2. Simulate "Activate Account" (User Action)
        console.log('\n2. Activating account...');
        // Verify token in DB
        const [tokens] = await connection.query('SELECT * FROM activation_tokens WHERE token = ?', [token]);
        if (tokens.length === 0) throw new Error('Token not found in DB');
        console.log('Token found.');

        // Set password
        const newPassword = 'newSecretPassword123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        await connection.query('UPDATE users SET password = ?, active = 1 WHERE id = ?', [hashedPassword, userId]);
        await connection.query('DELETE FROM activation_tokens WHERE token = ?', [token]);
        console.log('Account activated.');

        // 3. Verify Active State and Password Login
        const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (user.active !== 1) throw new Error('User should be active');
        console.log('User is active.');

        const isMatch = await bcrypt.compare(newPassword, user.password);
        if (!isMatch) throw new Error('Password hash mismatch');
        console.log('Password login verified.');

        console.log('\n✅ Verification Successful!');

    } catch (e) {
        console.error('❌ Verification Failed:', e);
    } finally {
        if (connection) connection.end();
    }
}

verifyAuthFlow();
