require('dotenv').config();
const mysql = require('mysql2/promise');

async function createExamSchema() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edubridge'
        });

        console.log('✅ Connected to database');

        // Create exams table
        console.log('\n📋 Creating exams table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS exams (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                grade VARCHAR(50) NOT NULL,
                section VARCHAR(10),
                teacher_id INT NOT NULL,
                exam_date DATETIME NOT NULL,
                duration INT NOT NULL COMMENT 'Duration in minutes',
                total_marks INT NOT NULL,
                status ENUM('draft', 'published') DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_teacher (teacher_id),
                INDEX idx_date (exam_date),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ exams table created');

        // Create exam_questions table (many-to-many relationship)
        console.log('\n📋 Creating exam_questions table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS exam_questions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                exam_id INT NOT NULL,
                question_id INT NOT NULL,
                marks INT NOT NULL COMMENT 'Marks for this question in this exam',
                question_order INT NOT NULL COMMENT 'Order of question in exam',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
                UNIQUE KEY unique_exam_question (exam_id, question_id),
                INDEX idx_exam (exam_id),
                INDEX idx_question (question_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ exam_questions table created');

        // Verify tables
        console.log('\n🔍 Verifying tables...');
        const [examColumns] = await connection.execute(`
            SHOW COLUMNS FROM exams
        `);
        console.log(`✅ exams table has ${examColumns.length} columns`);

        const [examQuestionsColumns] = await connection.execute(`
            SHOW COLUMNS FROM exam_questions
        `);
        console.log(`✅ exam_questions table has ${examQuestionsColumns.length} columns`);

        console.log('\n🎉 Exam schema created successfully!');

    } catch (error) {
        console.error('❌ Error creating exam schema:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the migration
createExamSchema()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
