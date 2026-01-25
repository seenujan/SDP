const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
    multipleStatements: true
};

async function createNotificationsTable() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('ptm', 'system', 'assignment', 'exam') NOT NULL DEFAULT 'system',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            CREATE INDEX idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX idx_notifications_is_read ON notifications(is_read);
        `;

        console.log('Creating notifications table...');
        await connection.query(createTableQuery);
        console.log('Notifications table created successfully.');

    } catch (error) {
        console.error('Error creating notifications table:', error);
    } finally {
        if (connection) await connection.end();
    }
}

createNotificationsTable();
