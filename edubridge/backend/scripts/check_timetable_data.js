
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function check() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('--- Timetable Data Sample ---');
        const [rows] = await connection.query("SELECT day_of_week FROM timetable LIMIT 10");
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
