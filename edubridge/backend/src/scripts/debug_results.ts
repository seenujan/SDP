import { pool } from '../config/database';

async function debugResults() {
    try {
        console.log('=== Debugging Results ===');

        // 1. Check Student Exam Attempts
        console.log('\nChecking student_exam_attempts:');
        const [attempts]: any = await pool.query('SELECT id, student_id, exam_id, status, total_score FROM student_exam_attempts');
        console.log(JSON.stringify(attempts, null, 2));

        if (attempts.length > 0) {
            const studentId = attempts[0].student_id;
            console.log(`\nChecking for student_id: ${studentId}`);

            // 2. Check Online Exam Marks for this student
            console.log('\nChecking online_exam_marks:');
            const [marks]: any = await pool.query('SELECT * FROM online_exam_marks WHERE student_id = ?', [studentId]);
            console.log(JSON.stringify(marks, null, 2));
        } else {
            console.log('No attempts found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

debugResults();
