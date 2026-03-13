import { pool } from '../src/config/database';
import { progressCardService } from '../src/services/ProgressCardService';

async function testProgressCard() {
    try {
        // Find a student with term marks
        const [rows]: any = await pool.query(`
            SELECT tm.student_id 
            FROM term_marks tm 
            JOIN students s ON tm.student_id = s.id 
            LIMIT 1
        `);

        if (rows.length === 0) {
            console.log('No term marks found to test with.');
            process.exit(0);
        }

        const studentId = rows[0].student_id;
        console.log(`Testing Progress Card for Student ID: ${studentId}, Term 1`);

        const data = await progressCardService.getTermProgressCard(studentId, 'Term 1');

        console.log('\n--- Student Info ---');
        console.log(`Name: ${data.student.full_name} (${data.student.class_name})`);

        console.log('\n--- Marks Breakdown ---');
        console.table(data.marks);

        console.log('\n--- Summary ---');
        console.log(`Total Marks: ${data.summary.total_marks}`);
        console.log(`Average: ${data.summary.average}%`);
        console.log(`Term Rank: #${data.summary.term_rank}`);
        console.log(`Attendance: ${data.summary.attendance_percentage}%`);

    } catch (error: any) {
        console.error('Test Failed:', error.message);
    } finally {
        await pool.end();
    }
}

testProgressCard();
