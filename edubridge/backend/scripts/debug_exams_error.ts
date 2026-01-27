import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
import { pool } from '../src/config/database';
import examService from '../src/services/ExamService';

async function testTrace() {
    try {
        console.log('Testing getExamsByClass...');
        // Need a valid classId and studentId. 
        // Based on dump, we saw student_id=2 (or similar) and attempts.
        // Let's find a valid student first.
        const [students]: any = await pool.query('SELECT id, class_id FROM students LIMIT 1');
        if (students.length === 0) {
            console.log('No students found'); return;
        }
        const s = students[0];
        console.log(`Using Student ID: ${s.id}, Class ID: ${s.class_id}`);

        const exams = await examService.getExamsByClass(s.class_id, s.id);
        console.log('Exams fetched:', exams.length);
        console.log(exams[0]);

    } catch (e: any) {
        console.error('ERROR CAUGHT:');
        console.error(e);
    } finally {
        await pool.end();
    }
}

testTrace();
