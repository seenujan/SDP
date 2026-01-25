import { pool } from '../config/database';

async function initTables() {
    try {
        console.log('Creating student_exam_attempts table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS student_exam_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                exam_id INT NOT NULL,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME NULL,
                status ENUM('in_progress', 'submitted', 'evaluated') DEFAULT 'in_progress',
                total_score DECIMAL(10, 2) DEFAULT 0,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
            )
        `);

        console.log('Creating student_exam_answers table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS student_exam_answers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                attempt_id INT NOT NULL,
                question_id INT NOT NULL,
                selected_option VARCHAR(255) NULL,
                text_answer TEXT NULL,
                is_correct BOOLEAN DEFAULT NULL,
                marks_awarded DECIMAL(10, 2) DEFAULT 0,
                FOREIGN KEY (attempt_id) REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
            )
        `);

        console.log('Tables created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    }
}

initTables();
