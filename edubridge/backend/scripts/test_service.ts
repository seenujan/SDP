
import { LeaveService } from '../src/services/LeaveService';
import { pool } from '../src/config/database';

async function test() {
    try {
        console.log('Testing LeaveService import...');
        const types = await LeaveService.getLeaveTypes();
        console.log('Leave Types:', types.length);
        console.log('SUCCESS');
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        process.exit();
    }
}
test();
