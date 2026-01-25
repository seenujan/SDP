const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function fixAssignmentsTable() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'school_management_system'
        });

        console.log('✅ Connected to database');

        // Check if section column exists
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM assignments LIKE 'section'
        `);

        if (columns.length === 0) {
            console.log('📋 Adding section column to assignments table...');
            await connection.execute(`
                ALTER TABLE assignments
                ADD COLUMN section VARCHAR(10) AFTER grade
            `);
            console.log('✅ section column added successfully');
        } else {
            console.log('ℹ️ section column already exists');
        }

        console.log('\n🎉 Assignments table fixed successfully!');

    } catch (error) {
        console.error('❌ Error fixing assignments table:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✅ Database connection closed');
        }
    }
}

fixAssignmentsTable();
