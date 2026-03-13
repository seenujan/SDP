import { pool } from '../src/config/database';

async function main() {
    const [r]: any = await pool.query(`
        SELECT s.subject_name, COUNT(t.id) as count 
        FROM subjects s 
        LEFT JOIN teachers t ON s.id = t.subject_id 
        GROUP BY s.id, s.subject_name 
        ORDER BY count DESC
    `);
    console.log(JSON.stringify(r, null, 2));
    await pool.end();
}
main();
