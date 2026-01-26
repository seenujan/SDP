import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
import { pool } from '../src/config/database';

async function debugMarks() {
    try {
        console.log('--- Debugging Exam Marks ---');

        // Get latest attempt
        const [recentAttempts]: any = await pool.query(
            'SELECT * FROM student_exam_attempts ORDER BY id DESC LIMIT 1'
        );

        if (recentAttempts.length === 0) {
            console.log('No attempts found.');
            return;
        }

        const attempt = recentAttempts[0];
        console.log(`Attempt ID: ${attempt.id}, Exam ID: ${attempt.exam_id}, Status: ${attempt.status}`);

        // Get Answers joined with Questions
        const [answers]: any = await pool.query(`
            SELECT 
                sea.id, 
                sea.question_id, 
                sea.text_answer, 
                sea.selected_option, 
                qb.question_text, 
                qb.question_type, 
                qb.correct_answer,
                qb.marks
            FROM student_exam_answers sea
            JOIN question_bank qb ON sea.question_id = qb.id
            WHERE sea.attempt_id = ?
        `, [attempt.id]);

        console.log(`Found ${answers.length} answers.`);

        const logs: string[] = [];

        for (const ans of answers) {
            logs.push(`\n------------------------------------------------`);
            logs.push(`QID: ${ans.question_id} (${ans.question_type})`);
            logs.push(`  Question: "${ans.question_text}"`);
            logs.push(`  Model Answer (DB): >${ans.correct_answer}<`);
            logs.push(`  Student Text: >${ans.text_answer}<`);
            logs.push(`  Student Option: >${ans.selected_option}<`);

            // Replicate Logic
            if (ans.question_type === 'short_answer' && ans.correct_answer) {
                const keywords = ans.correct_answer.split(',').map((k: string) => k.trim().toLowerCase());
                const studentText = (ans.text_answer || '').toLowerCase();
                const match = keywords.some((k: string) => studentText.includes(k));
                logs.push(`  LOGIC VALIDATION (Short Answer):`);
                logs.push(`    Keywords: ${JSON.stringify(keywords)}`);
                logs.push(`    Student Lower: >${studentText}<`);
                logs.push(`    Match Result: ${match}`);
            } else if (ans.question_type === 'multiple_choice' || ans.question_type === 'true_false') {
                // Check if it matches selected option
                logs.push(`  LOGIC VALIDATION (MCQ):`);
                logs.push(`    Model: >${ans.correct_answer}<`);
                logs.push(`    Chosen: >${ans.selected_option}<`);
                logs.push(`    Match: ${ans.selected_option === ans.correct_answer}`);
            }
        }

        console.log(logs.join('\n'));
        require('fs').writeFileSync(path.join(__dirname, '../debug_result.txt'), logs.join('\n'));
        console.log('Written to debug_result.txt');

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

debugMarks();
