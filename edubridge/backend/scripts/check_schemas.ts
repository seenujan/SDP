import { pool } from '../src/config/database';

async function checkSchemas() {
    const tables = ['term_marks', 'assignment_marks', 'student_exam_attempts', 'student_exam_answers'];
    for (const t of tables) {
        const [rows]: any = await pool.query(`DESCRIBE ${t}`);
        console.log(`\n-- ${t} --`);
        rows.forEach((r: any) => console.log(`  ${r.Field}: ${r.Type}`));
    }
    await pool.end();
}

checkSchemas().catch(e => { console.error(e.message); process.exit(1); });
