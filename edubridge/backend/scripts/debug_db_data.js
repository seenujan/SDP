
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function debugData() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [teachersList] = await connection.query('SELECT * FROM teachers WHERE full_name LIKE ?', ['%Mohan%']);
        console.log('--- Found Teachers ---');
        console.log(JSON.stringify(teachersList, null, 2));

        if (teachersList.length > 0) {
            const userId = teachersList[0].user_id;
            const subjectId = teachersList[0].subject_id;
            console.log(`\n--- Testing Main Query for User ID: ${userId} ---`);
            const [rows] = await connection.query(
                `SELECT l.* FROM teacher_leaves l WHERE l.teacher_id = ?`,
                [userId]
            );
            console.log(JSON.stringify(rows, null, 2));

            console.log(`\n--- Checking Relief Teachers for Subject ID: ${subjectId} ---`);
            const [relief] = await connection.query(
                `SELECT * FROM teachers WHERE subject_id = ? AND user_id != ?`,
                [subjectId, userId]
            );
            console.log(JSON.stringify(relief, null, 2));
        }

        await connection.end();
    } catch (err) {
        console.error(err);
    }
}

debugData();
