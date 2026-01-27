const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function forceAddPhone() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB');

        console.log('Attempting to add phone column...');
        try {
            await connection.query('ALTER TABLE teachers ADD COLUMN phone VARCHAR(20) NULL DEFAULT NULL');
            console.log('SUCCESS: Column added.');
        } catch (alterError) {
            if (alterError.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists (ER_DUP_FIELDNAME).');
            } else {
                throw alterError;
            }
        }

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    } finally {
        if (connection) connection.end();
    }
}

forceAddPhone();
