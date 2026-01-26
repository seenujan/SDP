
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edubridge'
};

async function fixTimetableSubjects() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        const [entries] = await connection.execute('SELECT id, subject FROM timetable');
        console.log(`Found ${entries.length} timetable entries`);

        for (const entry of entries) {
            if (entry.subject) {
                const capitalized = entry.subject.charAt(0).toUpperCase() + entry.subject.slice(1);
                if (capitalized !== entry.subject) {
                    await connection.execute('UPDATE timetable SET subject = ? WHERE id = ?', [capitalized, entry.id]);
                    console.log(`Updated timetable entry ${entry.id}: ${entry.subject} -> ${capitalized}`);
                }
            }
        }

        console.log('Timetable subjects fixed');

    } catch (error) {
        console.error('Error fixing timetable subjects:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixTimetableSubjects();
