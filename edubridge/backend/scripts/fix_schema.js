const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function fixSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        const alters = [
            "ALTER TABLE classes ADD COLUMN grade VARCHAR(50) NOT NULL",
            "ALTER TABLE classes ADD COLUMN section VARCHAR(10) NOT NULL",
            "ALTER TABLE classes ADD COLUMN class_teacher_id INT NULL"
        ];

        console.log('Running ALTERs...');
        for (const sql of alters) {
            try {
                await connection.query(sql);
                console.log(`Success: ${sql}`);
            } catch (e) {
                // Ignore duplicate column errors (1060)
                if (e.errno === 1060) {
                    console.log(`Skipped (Exists): ${sql}`);
                } else {
                    console.log(`Error on ${sql}: ${e.message}`);
                }
            }
        }

        // Also allow NULL parent_id
        try {
            await connection.query('ALTER TABLE students MODIFY parent_id INT NULL');
            console.log('Success: Allow NULL parent_id');
        } catch (e) {
            console.log('Error modifying parent_id: ' + e.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.end();
    }
}

fixSchema();
