
import { pool } from '../src/config/database';
import fs from 'fs';

async function diagnose() {
    const report: any = { assignments: [] };

    try {
        const [assignments]: any = await pool.query('SELECT * FROM assignments');

        for (const a of assignments) {
            const [submissions]: any = await pool.query('SELECT * FROM assignment_submissions WHERE assignment_id = ?', [a.id]);

            const submissionDetails = [];
            for (const s of submissions) {
                const [student]: any = await pool.query('SELECT * FROM students WHERE id = ?', [s.student_id]);
                submissionDetails.push({
                    submission: s,
                    student: student[0] || null
                });
            }

            report.assignments.push({
                info: a,
                submissions: submissionDetails
            });
        }

        fs.writeFileSync('diagnosis.json', JSON.stringify(report, null, 2));
        console.log('Diagnosis saved to diagnosis.json');

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

diagnose();
