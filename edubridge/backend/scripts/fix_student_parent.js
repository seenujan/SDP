require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function fixData() {
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

        // Get a valid parent
        const [parents] = await pool.query("SELECT id FROM users WHERE role = 'parent' LIMIT 1");

        if (parents.length === 0) {
            console.log('No parent user found. Please create a parent user first.');
            return;
        }

        const parentId = parents[0].id;
        console.log(`Found parent with ID: ${parentId}`);

        // Update students with missing parent_id
        // For this dev environment, we'll just set all students to this parent to ensure it works
        const [result] = await pool.query("UPDATE students SET parent_id = ? WHERE parent_id IS NULL OR parent_id = 0", [parentId]);

        console.log(`Updated ${result.changedRows} students to have parent_id ${parentId}`);

        // Double check
        const [students] = await pool.query("SELECT id, full_name, parent_id FROM students");
        students.forEach(s => {
            console.log(`Student: ${s.full_name}, ParentID: ${s.parent_id}`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixData();
