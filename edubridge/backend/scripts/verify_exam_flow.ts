
import { pool } from '../src/config/database';
import examService from '../src/services/ExamService';

async function verifyExamFlow() {
    try {
        console.log('=== Verifying Exam Flow ===');

        // 1. Find a Teacher
        const [teachers]: any = await pool.query('SELECT user_id FROM teachers LIMIT 1');
        if (teachers.length === 0) throw new Error('No teachers found');
        const teacherId = teachers[0].user_id;

        // 2. Create an Exam for Grade 4, Section A
        console.log('Creating exam for Grade 4 Section A...');
        const examA = await examService.createExam({
            title: 'Test Exam Section A',
            subject: 'Math',
            grade: 'Grade 4',
            section: 'A',
            exam_date: '2026-02-01',
            duration: 60,
            total_marks: 100
        }, teacherId);
        console.log(`Created Exam A (ID: ${examA.id})`);

        // 3. Create an Exam for Grade 4, Section B
        console.log('Creating exam for Grade 4 Section B...');
        const examB = await examService.createExam({
            title: 'Test Exam Section B',
            subject: 'Math',
            grade: 'Grade 4',
            section: 'B',
            exam_date: '2026-02-01',
            duration: 60,
            total_marks: 100
        }, teacherId);
        console.log(`Created Exam B (ID: ${examB.id})`);

        // 4. Test filtering
        console.log('\nTesting Filtering:');

        // Fetch for Grade 4, Section A
        const examsForA = await examService.getExamsByClass('Grade 4', 'A');
        const foundA_in_A = examsForA.find((e: any) => e.id === examA.id);
        const foundB_in_A = examsForA.find((e: any) => e.id === examB.id);
        console.log(`Student in 4-A sees Exam A? ${!!foundA_in_A} (Expected: true)`);
        console.log(`Student in 4-A sees Exam B? ${!!foundB_in_A} (Expected: false)`);

        // Fetch for Grade 4, Section B
        const examsForB = await examService.getExamsByClass('Grade 4', 'B');
        const foundA_in_B = examsForB.find((e: any) => e.id === examA.id);
        const foundB_in_B = examsForB.find((e: any) => e.id === examB.id);
        console.log(`Student in 4-B sees Exam A? ${!!foundA_in_B} (Expected: false)`);
        console.log(`Student in 4-B sees Exam B? ${!!foundB_in_B} (Expected: true)`);

        // Cleanup
        console.log('\nCleaning up test exams...');
        await examService.deleteExam(examA.id, teacherId);
        await examService.deleteExam(examB.id, teacherId);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

verifyExamFlow();
