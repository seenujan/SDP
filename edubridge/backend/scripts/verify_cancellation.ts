import { pool } from '../src/config/database';
import { LeaveService } from '../src/services/LeaveService';

async function verifyCancellation() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Get a Teacher and an Admin
        const [teachers] = await pool.query<any[]>('SELECT user_id FROM teachers LIMIT 1');
        const [admins] = await pool.query<any[]>('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        const [reliefs] = await pool.query<any[]>('SELECT user_id FROM teachers WHERE user_id != ? LIMIT 1', [teachers[0].user_id]);

        if (!teachers.length || !admins.length || !reliefs.length) {
            console.error('Insufficient users for test.');
            process.exit(1);
        }

        const teacherId = teachers[0].user_id;
        const adminId = admins[0].id;
        const reliefId = reliefs[0].user_id;

        console.log(`Teacher: ${teacherId}, Admin: ${adminId}, Relief: ${reliefId}`);

        // 2. Scenario A: Teacher Cancels
        console.log('\n--- Scenario A: Teacher Cancels ---');
        const leaveIdA = await LeaveService.applyLeave(teacherId, {
            leave_type_id: 1,
            start_date: '2026-03-01',
            end_date: '2026-03-02',
            reason: 'Test Leave A',
            relief_teacher_id: reliefId,
            is_half_day: false
        });
        console.log(`Leave A Created: ${leaveIdA}`);

        await LeaveService.cancelLeave(leaveIdA, teacherId);
        console.log('Leave A Cancelled by Teacher');

        const [leaveA] = await pool.query<any[]>('SELECT status, cancelled_by FROM teacher_leaves WHERE id = ?', [leaveIdA]);
        console.log('Leave A DB State:', leaveA[0]);

        if (leaveA[0].status === 'cancelled' && leaveA[0].cancelled_by === teacherId) {
            console.log('✅ Scenario A Passed');
        } else {
            console.error('❌ Scenario A Failed');
        }

        // 3. Scenario B: Admin Cancels
        console.log('\n--- Scenario B: Admin Cancels ---');
        const leaveIdB = await LeaveService.applyLeave(teacherId, {
            leave_type_id: 1,
            start_date: '2026-03-05',
            end_date: '2026-03-06',
            reason: 'Test Leave B',
            relief_teacher_id: reliefId,
            is_half_day: false
        });
        console.log(`Leave B Created: ${leaveIdB}`);

        // Admin approves first (usually)
        // Assume relief accepted (cheat a bit for test)
        await pool.query('UPDATE teacher_leaves SET relief_status = "Approved" WHERE id = ?', [leaveIdB]);
        await LeaveService.updateLeaveStatus(leaveIdB, 'approved', null, adminId);
        console.log('Leave B Approved');

        // Admin Cancels
        await LeaveService.cancelLeave(leaveIdB, adminId);
        console.log('Leave B Cancelled by Admin');

        const [leaveB] = await pool.query<any[]>('SELECT status, cancelled_by FROM teacher_leaves WHERE id = ?', [leaveIdB]);
        console.log('Leave B DB State:', leaveB[0]);

        if (leaveB[0].status === 'cancelled' && leaveB[0].cancelled_by === adminId) {
            console.log('✅ Scenario B Passed');
        } else {
            console.error('❌ Scenario B Failed');
        }

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await pool.end();
    }
}

verifyCancellation();
