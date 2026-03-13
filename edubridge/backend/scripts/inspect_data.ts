import { pool } from '../src/config/database';

async function inspect() {
    const [students]: any = await pool.query('SELECT id, class_id FROM students');
    const [subjects]: any = await pool.query('SELECT id, subject_name FROM subjects');
    const [classes]: any = await pool.query('SELECT id, grade, section FROM classes');
    const [assignments]: any = await pool.query('SELECT id, title, class_id, subject_id FROM assignments');
    const [tmCount]: any = await pool.query('SELECT COUNT(*) as c FROM term_marks');
    const [amCount]: any = await pool.query('SELECT COUNT(*) as c FROM assignment_marks');

    console.log(`Students: ${students.length}`);
    console.log(`Subjects: ${subjects.length}`);
    console.log(`Classes: ${classes.length}`);
    console.log(`Assignments: ${assignments.length}`);
    console.log(`Existing term_marks: ${tmCount[0].c}`);
    console.log(`Existing assignment_marks: ${amCount[0].c}`);
    console.log('\nSubjects:', subjects.map((s: any) => `${s.id}:${s.subject_name}`).join(', '));
    console.log('\nSample assignments:', assignments.slice(0, 5).map((a: any) => `id=${a.id} class=${a.class_id} subj=${a.subject_id}`).join(', '));

    await pool.end();
}
inspect().catch(e => { console.error(e.message); process.exit(1); });
