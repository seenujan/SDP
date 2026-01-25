
import { pool } from '../config/database';

async function getStudentCreds() {
    try {
        console.log('Fetching student credentials...');
        const [rows]: any = await pool.query("SELECT u.email, u.password FROM users u JOIN students s ON u.id = s.user_id LIMIT 1");
        if (rows.length > 0) {
            console.log('EMAIL:' + rows[0].email);
            console.log('PASS:' + rows[0].password);
        } else {
            console.log('No students found.');
        }
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

getStudentCreds();
