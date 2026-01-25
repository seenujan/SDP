const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '#Seenu2003',
    database: process.env.DB_NAME || 'school_management' // Default from environment.ts
};

async function setupAuthSchema() {
    let connection;
    try {
        console.log(`Connecting to ${dbConfig.host} as ${dbConfig.user}...`);
        // console.log(`Password length: ${dbConfig.password.length}`); 
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        // 1. Check/Add "active" column to users table
        console.log('Checking "active" column in users table...');
        const [columns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'active'`);
        if (columns.length === 0) {
            console.log('Adding "active" column...');
            await connection.query(`ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT 0`);
            await connection.query(`UPDATE users SET active = 1`);
            console.log('Added "active" column and set existing users to active.');
        } else {
            console.log('"active" column already exists.');
        }

        // 2. Create activation_tokens table
        console.log('Checking "activation_tokens" table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activation_tokens (
                token VARCHAR(255) PRIMARY KEY,
                user_id INT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('"activation_tokens" table ensured.');

        console.log('Schema setup completed successfully.');

    } catch (e) {
        console.error('Error setting up auth schema:', e);
        if (e.code === 'ER_BAD_DB_ERROR') {
            console.error(`Database '${dbConfig.database}' not found. Trying 'school_management_system'...`);
            // Fallback logic could be added here or just manual intervention
        }
    } finally {
        if (connection) connection.end();
    }
}

setupAuthSchema();
