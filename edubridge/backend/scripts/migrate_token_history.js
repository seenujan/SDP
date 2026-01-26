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

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(config);
        console.log('Connected successfully.');

        // 1. Add columns to activation_tokens
        console.log('Checking activation_tokens table...');
        try {
            await connection.query(`
                ALTER TABLE activation_tokens 
                ADD COLUMN is_used TINYINT(1) DEFAULT 0,
                ADD COLUMN used_at TIMESTAMP NULL
            `);
            console.log('Added columns to activation_tokens.');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('Columns already exist in activation_tokens.');
            } else {
                throw error;
            }
        }

        // 2. Add columns to password_resets
        console.log('Checking password_resets table...');
        try {
            await connection.query(`
                ALTER TABLE password_resets 
                ADD COLUMN is_used TINYINT(1) DEFAULT 0,
                ADD COLUMN used_at TIMESTAMP NULL
            `);
            console.log('Added columns to password_resets.');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('Columns already exist in password_resets.');
            } else {
                throw error;
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
