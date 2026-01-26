const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function cleanupCertificateTypes() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // 1. Truncate tables (Cascades to certificate_issue)
        console.log('Truncating certificate_types (This will delete all issued certificates)...');
        // Disable FK checks to truncate parent table
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE certificate_types');
        await connection.query('TRUNCATE TABLE certificate_issue');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Tables truncated.');

        // 2. Drop description column if exists
        console.log('Dropping description column from certificate_types...');
        try {
            await connection.query(`ALTER TABLE certificate_types DROP COLUMN description`);
            console.log('Column dropped.');
        } catch (e) {
            console.log('Column might not exist or already dropped:', e.message);
        }

        // 3. Seed Strict Types
        console.log('Seeding Strict Certificate Types...');
        const typesToSeed = [
            'Achievement Certificates',
            'Participation Certificates',
            'Sports Certificates',
            'Character Certificates',
            'Leaving Certificates'
        ];

        for (const typeName of typesToSeed) {
            await connection.query(`INSERT INTO certificate_types (name) VALUES (?)`, [typeName]);
            console.log(`Added type: ${typeName}`);
        }

        console.log('Cleanup and Seeding Completed!');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

cleanupCertificateTypes();
