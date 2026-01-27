
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createScholarshipsTable() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const connection = await mysql.createConnection(config);

    try {
        console.log('Creating scholarships table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS scholarships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                awarded_date DATE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            )
        `);
        console.log('Table created.');

        console.log('Seeding mock scholarships...');
        // Bind to existing student
        const [students] = await connection.query('SELECT id FROM students LIMIT 5');

        if (students.length > 0) {
            for (const student of students) {
                await connection.query(`
                    INSERT INTO scholarships (student_id, title, amount, awarded_date, description)
                    VALUES (?, 'Merit Scholarship 2026', 5000.00, CURDATE(), 'Awarded for academic excellence')
                `, [student.id]);
            }
            console.log(`Seeded ${students.length} scholarships.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

createScholarshipsTable();
