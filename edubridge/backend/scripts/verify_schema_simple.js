
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        const [rows] = await connection.query('SHOW COLUMNS FROM portfolios');
        const columns = rows.map(r => r.Field);

        const hasTeacherId = columns.includes('teacher_id');
        const hasDisciplineRemarks = columns.includes('discipline_remarks');
        const hasTempTeacherId = columns.includes('temp_teacher_id');
        const hasTeacherRemarks = columns.includes('teacher_remarks');

        if (hasTeacherId && hasDisciplineRemarks && !hasTempTeacherId && !hasTeacherRemarks) {
            console.log('SUCCESS: Schema is correct.');
        } else {
            console.log('FAILURE: Schema incorrect.');
            console.log({ hasTeacherId, hasDisciplineRemarks, hasTempTeacherId, hasTeacherRemarks });
        }

    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
}

verify();
