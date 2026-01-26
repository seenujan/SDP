
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edubridge'
};

async function capitalizeSubjects() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        const [subjects] = await connection.execute('SELECT id, subject_name FROM subjects');
        console.log(`Found ${subjects.length} subjects`);

        for (const subject of subjects) {
            if (subject.subject_name) {
                const capitalized = subject.subject_name.charAt(0).toUpperCase() + subject.subject_name.slice(1);
                if (capitalized !== subject.subject_name) {
                    await connection.execute('UPDATE subjects SET subject_name = ? WHERE id = ?', [capitalized, subject.id]);
                    console.log(`Updated subject: ${subject.subject_name} -> ${capitalized}`);
                }
            }
        }

        console.log('Subjects capitalization complete');

    } catch (error) {
        console.error('Error capitalizing subjects:', error);
    } finally {
        if (connection) await connection.end();
    }
}

capitalizeSubjects();
