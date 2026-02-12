
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function checkLeaves() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SELECT l.id, t.full_name as teacher, lt.name as type, l.start_date, l.status 
            FROM teacher_leaves l
            JOIN teachers t ON l.teacher_id = t.user_id
            JOIN leave_types lt ON l.leave_type_id = lt.id
            ORDER BY l.id DESC LIMIT 5
        `);
        console.table(rows);
        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkLeaves();
