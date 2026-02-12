
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
        console.log('--- Timetable Table ---');
        const [cols] = await connection.query("SHOW COLUMNS FROM timetable");
        cols.forEach(c => console.log(c.Field));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
