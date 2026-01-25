require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function checkData() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('--- Students Data ---');
        const [students] = await pool.query(`
            SELECT s.id, s.full_name, s.parent_id, u.role as parent_role_check
            FROM students s
            LEFT JOIN users u ON s.parent_id = u.id
        `);
        console.log('--- Students Data ---');
        console.log(JSON.stringify(students, null, 2));

        console.log('\n--- Parents Users ---');
        const [parents] = await pool.query(`
            SELECT id, email, role FROM users WHERE role = 'parent'
        `);
        console.log(JSON.stringify(parents, null, 2));

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkData();
