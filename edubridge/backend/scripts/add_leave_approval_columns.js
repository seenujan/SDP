
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('--- Adding Missing Columns to teacher_leaves ---');

        // Add rejection_reason
        try {
            await connection.query(`ALTER TABLE teacher_leaves ADD COLUMN rejection_reason TEXT NULL`);
            console.log('rejection_reason added.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('rejection_reason already exists.');
            else console.error('Error adding rejection_reason:', e.message);
        }

        // Add approver_id
        try {
            await connection.query(`ALTER TABLE teacher_leaves ADD COLUMN approver_id INT NULL`);
            console.log('approver_id added.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('approver_id already exists.');
            else console.error('Error adding approver_id:', e.message);
        }

        // Add Foreign Key
        try {
            await connection.query(`ALTER TABLE teacher_leaves ADD FOREIGN KEY (approver_id) REFERENCES users(id)`);
            console.log('Foreign key added.');
        } catch (e) {
            if (e.code === 'ER_DUP_KEY' || e.message.includes('Duplicate key')) console.log('Foreign key likely exists.');
            else console.error('Error adding foreign key:', e.message);
        }

    } catch (err) {
        console.error('Migration Failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
