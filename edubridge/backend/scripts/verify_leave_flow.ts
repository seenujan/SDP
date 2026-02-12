
import { pool } from '../src/config/database';
import { LeaveService } from '../src/services/LeaveService';
import { RowDataPacket } from 'mysql2';

async function runVerification() {
    try {
        console.log('Starting Verification for Two-Step Leave Approval...');

        // 1. Get Actors
        const [teachers] = await pool.query<RowDataPacket[]>('SELECT user_id, full_name FROM teachers LIMIT 2');
        if (teachers.length < 2) throw new Error('Need at least 2 teachers');

        const applicant = teachers[0];
        const relief = teachers[1];

        const [admins] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        const adminId = admins.length > 0 ? admins[0].id : 1; // Fallback to 1 if no admin found

        const [leaveTypes] = await pool.query<RowDataPacket[]>('SELECT id FROM leave_types LIMIT 1');
        const leaveTypeId = leaveTypes[0].id;

        console.log(`Applicant: ${applicant.full_name} (${applicant.user_id})`);
        console.log(`Relief: ${relief.full_name} (${relief.user_id})`);
        console.log(`Admin ID: ${adminId}`);

        // 2. Apply for Leave
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];


        console.log(`\nStep 1: Applying for leave (${today} to ${tomorrow})...`);
        try {
            const leaveId = await LeaveService.applyLeave(applicant.user_id, {
                leave_type_id: leaveTypeId,
                start_date: today,
                end_date: tomorrow,
                reason: 'Verification Test',
                relief_teacher_id: relief.user_id,
                is_half_day: false
            });
            console.log(`Leave applied. ID: ${leaveId}`);

            // 3. Attempt Admin Approval (Should Fail)
            console.log('\nStep 2: Attempting Admin Approval (Should Fail)...');
            try {
                await LeaveService.updateLeaveStatus(leaveId, 'approved', null, adminId);
                console.error('FAIL: Admin approval should have failed!');
            } catch (error: any) {
                console.log(`SUCCESS: Admin approval failed as expected: "${error.message}"`);
            }

            // 4. Relief Teacher Accepts
            console.log('\nStep 3: Relief Teacher Accepting Request...');
            await LeaveService.respondToReliefRequest(leaveId, relief.user_id, 'Approved');
            console.log('Relief request accepted.');

            // 5. Attempt Admin Approval (Should Succeed)
            console.log('\nStep 4: Attempting Admin Approval (Should Succeed)...');
            await LeaveService.updateLeaveStatus(leaveId, 'approved', null, adminId);
            console.log('SUCCESS: Admin approval succeeded.');

            // Cleanup
            console.log('\nCleaning up test data...');
            await pool.query('DELETE FROM teacher_leaves WHERE id = ?', [leaveId]);
            console.log('Cleanup complete.');

        } catch (innerError) {
            console.error('Inner Block Failed:', innerError);
        }

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        // Force exit
        setTimeout(() => process.exit(), 100);
    }
}

runVerification();