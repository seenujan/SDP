const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixEnum() {
    console.log('Connecting to database...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Altering teacher_leaves table to include "cancelled" in status enum...');
        await pool.query(`
            ALTER TABLE teacher_leaves 
            MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'cancelled') NULL DEFAULT 'pending';
        `);
        console.log('Successfully updated status enum.');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await pool.end();
    }
}

fixEnum();
