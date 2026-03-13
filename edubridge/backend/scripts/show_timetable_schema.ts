import { pool } from '../src/config/database';

async function main() {
    const [rows]: any = await pool.query('SHOW CREATE TABLE timetable');
    console.log(rows[0]['Create Table']);
    await pool.end();
}

main().catch(console.error);
