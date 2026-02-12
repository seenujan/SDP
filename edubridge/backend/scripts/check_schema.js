
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '#Seenu2003',
    database: 'school_management_system'
};

async function checkSchema() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [tables] = await connection.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('Tables:', tableNames);

        if (tableNames.includes('teacher_leaves')) {
            const [lCols] = await connection.query("SHOW COLUMNS FROM teacher_leaves");
            console.log('teacher_leaves:', lCols.map(c => `${c.Field} (${c.Type})`));
        }

        if (tableNames.includes('notifications')) {
            const [nCols] = await connection.query("SHOW COLUMNS FROM notifications");
            console.log('notifications:', nCols.map(c => `${c.Field} (${c.Type})`));
        } else {
            console.log('notifications table MISSING');
        }

        if (tableNames.includes('timetable')) {
            const [tCols] = await connection.query("SHOW COLUMNS FROM timetable");
            console.log('timetable:', tCols.map(c => `${c.Field} (${c.Type})`));
        } else {
            console.log('timetable table MISSING');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkSchema();
