const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
};

const newSubjects = [
    'tamil',
    'maths',
    'science',
    'history',
    'english',
    'sinhala',
    'geography',
    'civics',
    'pts',
    'arts',
    'dance',
    'music',
    'drama',
    'physics',
    'chemistry',
    'biology'
];

async function reseedSubjects() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to DB...');

        // Disable FK checks to allow truncate
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('Truncating subjects table...');
        await connection.query('TRUNCATE TABLE subjects');

        // Reset FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Inserting new subjects...');
        const values = newSubjects.map(s => [s]);
        await connection.query('INSERT INTO subjects (subject_name) VALUES ?', [values]);

        console.log(`Successfully added ${newSubjects.length} subjects.`);

        // Verification
        const [rows] = await connection.query('SELECT * FROM subjects');
        console.table(rows);

    } catch (error) {
        console.error('Reseed Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

reseedSubjects();
