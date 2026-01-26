const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

async function migrateCertificateIssue() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // 1. Rename table certificates -> certificate_issue
        console.log('Renaming table...');
        try {
            // Check if certificates exists
            const [tables] = await connection.query(`SHOW TABLES LIKE 'certificates'`);
            if (tables.length > 0) {
                await connection.query(`RENAME TABLE certificates TO certificate_issue`);
                console.log('Table renamed successfully.');
            } else {
                const [newTables] = await connection.query(`SHOW TABLES LIKE 'certificate_issue'`);
                if (newTables.length > 0) {
                    console.log('Table certificate_issue already exists.');
                } else {
                    console.log('Table certificates not found?');
                }
            }
        } catch (e) {
            console.log('Error renaming table:', e.message);
        }

        // 2. Add description column to certificate_issue
        console.log('Adding description column...');
        try {
            await connection.query(`ALTER TABLE certificate_issue ADD COLUMN description TEXT`);
        } catch (e) {
            console.log('Column might already exist:', e.message);
        }

        // 3. Seed Certificate Types
        console.log('Seeding Certificate Types...');
        const typesToSeed = [
            'Achievement Certificate',
            'Participation Certificate',
            'Sports Certificate',
            'Character Certificate',
            'Leaving Certificate'
        ];

        for (const typeName of typesToSeed) {
            const [existing] = await connection.query(`SELECT id FROM certificate_types WHERE name = ?`, [typeName]);
            if (existing.length === 0) {
                await connection.query(`INSERT INTO certificate_types (name) VALUES (?)`, [typeName]);
                console.log(`Added type: ${typeName}`);
            }
        }

        console.log('Migration and Seeding Completed!');

    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateCertificateIssue();
