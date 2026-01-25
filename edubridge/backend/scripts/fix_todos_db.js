const mysql = require('mysql2/promise');

// Configuration with correct credentials
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function executeSql() {
    console.log('Starting database fix...');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Drop table
        console.log('Dropping student_todos table...');
        await connection.query('DROP TABLE IF EXISTS student_todos');

        // Create table
        console.log('Creating student_todos table...');
        const createTableQuery = `
            CREATE TABLE student_todos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
                status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
                category VARCHAR(50) DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                INDEX idx_student_id (student_id),
                INDEX idx_status (status),
                INDEX idx_due_date (due_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.query(createTableQuery);

        console.log('✅ Database fix executed successfully.');
    } catch (error) {
        console.error('❌ Error executing SQL:', error);
    } finally {
        if (connection) await connection.end();
    }
}

executeSql();
