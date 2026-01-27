
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:\\SDP\\edubridge\\backend\\.env' });

async function inspectSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edubridge'
        });


        console.log('--- portfolios ---');
        const [portfolios] = await connection.query('SHOW CREATE TABLE portfolios');
        console.log(portfolios[0]['Create Table']);

        console.log('\n--- teachers ---');
        const [teachers] = await connection.query('SHOW CREATE TABLE teachers');
        console.log(teachers[0]['Create Table']);

        // Check a sample data to see what teacher_id currently holds
        const [sample] = await connection.query('SELECT teacher_id FROM portfolios LIMIT 5');
        console.log('\nSample teacher_id in portfolios:', sample);

        // Also check if these IDs exist in teachers(id) or users(id)
        if (sample.length > 0 && sample[0].teacher_id) {
            const tid = sample[0].teacher_id;
            const [inTeachers] = await connection.query('SELECT id FROM teachers WHERE id = ?', [tid]);
            const [inUsers] = await connection.query('SELECT id FROM users WHERE id = ?', [tid]);
            console.log(`Checking ID ${tid}: Found in teachers? ${inTeachers.length > 0}, Found in users? ${inUsers.length > 0}`);
        }


        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

inspectSchema();
