import { pool } from '../config/database';

async function initExamQuestions() {
    try {
        console.log('Creating exam_questions table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS exam_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                exam_id INT NOT NULL,
                question_id INT NOT NULL,
                marks INT NOT NULL,
                question_order INT NOT NULL,
                FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
            )
        `);
        console.log('Table exam_questions created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

initExamQuestions();
