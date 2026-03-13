import { pool } from '../src/config/database';
import fs from 'fs';

async function run() {
    const [desc]: any = await pool.query('DESCRIBE timetable');
    fs.writeFileSync('timetable_schema.txt', JSON.stringify(desc.map((r: any) => ({ Field: r.Field, Type: r.Type })), null, 2));
    console.log('Done');
    await pool.end();
}
run();
