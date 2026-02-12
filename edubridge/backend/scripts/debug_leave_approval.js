
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function debugApproval() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('--- Starting Leave Approval Simulation ---');

        // 1. Get a pending leave ID (or use a known one if verifying specific case)
        const [leaves] = await connection.query("SELECT id, teacher_id, start_date, end_date FROM teacher_leaves WHERE status = 'pending' LIMIT 1");

        if (leaves.length === 0) {
            console.log('No pending leaves found to test.');
            return;
        }

        const leaveId = leaves[0].id;
        console.log(`Testing with Leave ID: ${leaveId}`);

        console.log('--- Checking Columns ---');
        const [columns] = await connection.query("SHOW COLUMNS FROM teacher_leaves");
        console.log('Fields:', columns.map(c => c.Field));

        // 2. Simulate Update Logic
        await connection.beginTransaction();

        console.log('Updating status...');
        await connection.query(
            `UPDATE teacher_leaves 
             SET status = ?, rejection_reason = ?, approver_id = ?
             WHERE id = ?`,
            ['approved', null, 1, leaveId] // Assuming Admin ID 1
        );

        // 3. PTM Check Logic
        console.log('Checking for PTMs...');
        const [ptms] = await connection.query(
            `SELECT id, parent_id, meeting_date, meeting_time 
             FROM ptm_meetings 
             WHERE teacher_id = ? 
             AND status IN ('pending', 'approved')
             AND meeting_date BETWEEN ? AND ?`,
            [leaves[0].teacher_id, leaves[0].start_date, leaves[0].end_date]
        );
        console.log(`Found ${ptms.length} conflicting PTMs.`);

        if (ptms.length > 0) {
            console.log('First PTM:', ptms[0]);
        }

        // Rollback so we don't actually change data
        await connection.rollback();
        console.log('Simulation complete. Rollback successful.');

    } catch (err) {
        console.error('--- ERROR CAUGHT ---');
        console.error(err);
        await connection.rollback();
    } finally {
        await connection.end();
    }
}

debugApproval();
