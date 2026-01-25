
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
    multipleStatements: true
};

async function migratePTM() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        console.log('Updating ptm_meetings schema...');

        // Disable foreign keys to allow dropping tables out of order
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop tables if they exist
        await connection.query("DROP TABLE IF EXISTS ptm_feedback");
        await connection.query("DROP TABLE IF EXISTS ptm_meetings"); // Prioritize ptm_meetings
        await connection.query("DROP TABLE IF EXISTS ptm_bookings"); // Cleanup potential old name

        const createMeetingsTable = `
            CREATE TABLE IF NOT EXISTS ptm_meetings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                teacher_id INT NOT NULL,
                parent_id INT NOT NULL,
                meeting_date DATE NOT NULL,
                meeting_time VARCHAR(20) NOT NULL,
                status ENUM('pending', 'approved', 'rejected', 'completed', 'reschedule_requested') NOT NULL DEFAULT 'pending',
                initiator ENUM('parent', 'teacher') NOT NULL DEFAULT 'parent',
                notes TEXT,
                rejection_reason TEXT,
                alternative_date DATE,
                alternative_time VARCHAR(20),
                teacher_remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;

        const createFeedbackTable = `
            CREATE TABLE IF NOT EXISTS ptm_feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ptm_meeting_id INT NOT NULL,
                feedback_from ENUM('teacher', 'parent') NOT NULL,
                feedback TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ptm_meeting_id) REFERENCES ptm_meetings(id) ON DELETE CASCADE
            );
        `;

        await connection.query(createMeetingsTable);
        console.log('ptm_meetings table created successfully!');

        await connection.query(createFeedbackTable);
        console.log('ptm_feedback table created successfully!');

        // Re-enable foreign keys
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // Verify
        const [cols] = await connection.query("DESCRIBE ptm_meetings");
        console.log('Table structure:', cols.map(c => c.Field).join(', '));

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migratePTM();
