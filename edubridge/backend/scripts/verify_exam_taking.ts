
import { pool } from '../src/config/database';
import examService from '../src/services/ExamService';

async function verifyExamTaking() {
    try {
        console.log('=== Verifying Exam Taking Flow ===');

        // 1. Setup Data
        // Find teacher
        const [teachers]: any = await pool.query('SELECT user_id FROM teachers LIMIT 1');
        const teacherId = teachers[0].user_id;

        // Find student
        const [students]: any = await pool.query('SELECT id, user_id FROM students LIMIT 1');
        const studentId = students[0].id;

        // Create Verification Exam
        console.log('Creating Test Exam...');
        const exam = await examService.createExam({
            title: 'Verification Exam',
            subject: 'Test Subject',
            grade: 'Grade 10', // Assuming student fits, or we verify independent of student constraints for service layer
            exam_date: '2026-02-01',
            duration: 30,
            total_marks: 10
        }, teacherId);

        // Add Questions
        console.log('Adding Questions...');
        // We need valid question IDs. For this test, let's fast-track and assume some questions exist or create them.
        // Actually, let's create a question for the test to be robust.
        const [qbResult]: any = await pool.execute(
            `INSERT INTO question_bank (teacher_id, subject, topic, question_text, question_type, marks, correct_answer) 
             VALUES (?, 'Test', 'General', 'Is this a test?', 'true_false', 5, 'True')`,
            [teacherId]
        );
        const questionId = qbResult.insertId;

        await examService.addQuestionsToExam(exam.id, [{ question_id: questionId, marks: 5 }], teacherId);


        // 2. Test Get Exam (Student View)
        console.log('\nTesting getStudentExamById...');
        const studentExam: any = await examService.getStudentExamById(exam.id);

        if (studentExam.questions[0].correct_answer) {
            console.error('FAIL: Correct answer leaking in student view!');
        } else {
            console.log('PASS: Correct answer hidden from student.');
        }

        // 3. Test Submit Exam
        console.log('\nTesting submitExamAttempt...');
        const answers = [
            { exam_question_id: studentExam.questions[0].exam_question_id, selected_option: 'True' }
        ];

        const result = await examService.submitExamAttempt(studentId, exam.id, answers);
        console.log(`Submission Result: Score ${result.score}/5`);

        if (result.score === 5) {
            console.log('PASS: Exact match grading worked.');
        } else {
            console.error('FAIL: Grading mismatch.');
        }

        // Cleanup
        console.log('\nCleaning up...');
        await examService.deleteExam(exam.id, teacherId);
        await pool.execute('DELETE FROM question_bank WHERE id = ?', [questionId]);
        await pool.execute('DELETE FROM online_exam_marks WHERE exam_id = ?', [exam.id]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

verifyExamTaking();
