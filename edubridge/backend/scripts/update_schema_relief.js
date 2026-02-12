
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function updateSchema() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('--- Updating Schema for Relief Teacher System ---');

        // 1. Update teacher_leaves table
        console.log('Checking teacher_leaves table...');
        const [lCols] = await connection.query("SHOW COLUMNS FROM teacher_leaves LIKE 'relief_status'");
        if (lCols.length === 0) {
            console.log('Adding relief_status and relief_rejection_reason to teacher_leaves...');
            await connection.query(`
                ALTER TABLE teacher_leaves 
                ADD COLUMN relief_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' AFTER relief_teacher_id,
                ADD COLUMN relief_rejection_reason TEXT AFTER relief_status
            `);
            console.log('teacher_leaves updated.');
        } else {
            console.log('teacher_leaves already has relief_status.');
        }

        // 2. Update notifications table type enum
        console.log('Updating notifications type enum...');
        // First get current definition to be safe/aware, but we'll specificially extend it.
        // We need to include all existing types PLUS 'relief_request' and 'leave_update'
        // Existing: 'ptm','attendance','result','system','assignment','exam'

        await connection.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN type ENUM('ptm','attendance','result','system','assignment','exam','relief_request','leave_update') NOT NULL DEFAULT 'system'
        `);
        console.log('notifications table type enum updated.');

    } catch (err) {
        console.error('Error updating schema:', err.message);
    } finally {
        await connection.end();
    }
}

updateSchema();
