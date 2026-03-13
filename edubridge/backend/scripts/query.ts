import { pool } from 'c:/SDP/edubridge/backend/src/config/database';

async function main() {
    const [classes]: any = await pool.query('SELECT * FROM classes');
    console.log('Classes:', classes);
    const [subjects]: any = await pool.query('SELECT * FROM subjects');
    console.log('Subjects:', subjects);
    await pool.end();
}
main();
