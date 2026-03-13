import { pool } from '../src/config/database';
import fs from 'fs';

async function describeTables() {
    let output = '';
    try {
        for (const table of ['users', 'students', 'teachers', 'classes', 'parents']) {
            const [desc]: any = await pool.query(`DESCRIBE ${table}`);
            output += `\n--- ${table.toUpperCase()} ---\n`;
            output += JSON.stringify(desc.map((row: any) => ({ Field: row.Field, Type: row.Type })), null, 2);
        }
        fs.writeFileSync('schema_info.txt', output);
        console.log('Schema written to schema_info.txt');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

describeTables();
