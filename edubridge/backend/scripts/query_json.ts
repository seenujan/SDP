import { pool } from 'c:/SDP/edubridge/backend/src/config/database';
import fs from 'fs';

async function main() {
    const [classes]: any = await pool.query('SELECT * FROM classes');
    const [subjects]: any = await pool.query('SELECT * FROM subjects');

    fs.writeFileSync('/tmp/data.json', JSON.stringify({ classes, subjects }, null, 2));

    await pool.end();
}
main();
