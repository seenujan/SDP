import { pool } from 'c:/SDP/edubridge/backend/src/config/database';

async function main() {
    const [assignments]: any = await pool.query('SELECT * FROM assignments LIMIT 1');
    console.log(assignments);
    await pool.end();
}
main();
