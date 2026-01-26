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

async function reproduce() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await mysql.createConnection(config);

        // Check engine first
        const [engines] = await connection.query(`
            SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('users', 'teachers')
        `, [config.database]);
        console.log('Engines:', engines);

        console.log('Starting Transaction...');
        await connection.beginTransaction();

        const email = `trans_test_${Date.now()}@example.com`;
        console.log(`Inserting user ${email}...`);

        const [userRes] = await connection.query(
            'INSERT INTO users (email, password, role, active) VALUES (?, ?, ?, ?)',
            [email, 'pass', 'teacher', 1]
        );
        const userId = userRes.insertId;
        console.log(`User inserted with ID: ${userId}`);

        console.log('Attempting to insert teacher with INVALID subject_id...');
        try {
            await connection.query(
                'INSERT INTO teachers (user_id, full_name, subject_id) VALUES (?, ?, ?)',
                [userId, 'Trans Test Teacher', 999999] // Invalid subject_id
            );
        } catch (err) {
            console.log('Caught expected error:', err.message);
            console.log('Rolling back...');
            await connection.rollback();
        }

        // Verify if user exists
        const [check] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (check.length === 0) {
            console.log('SUCCESS: User record was rolled back. Transaction works.');
        } else {
            console.log('FAILURE: User record STILL EXISTS. Transaction failed to rollback.');
        }

        // Cleanup if failure
        if (check.length > 0) {
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        }

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

reproduce();
