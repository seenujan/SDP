import { pool } from '../src/config/database';
import fs from 'fs';

async function getMockUsers() {
    let output = '';
    output += '=============================================================\n';
    output += '              MOCK USER DETAILS REPORT\n';
    output += '         *** Universal Password: Password@123 ***\n';
    output += '=============================================================\n';

    try {
        // ---- ADMINS ----
        const [admins]: any = await pool.query(`SELECT email FROM users WHERE role = 'admin' ORDER BY email`);
        output += '\n\n╔══════════════════════════════════════╗\n';
        output += '║             ADMIN ACCOUNTS           ║\n';
        output += '╚══════════════════════════════════════╝\n';
        for (const a of admins) {
            output += `  Email: ${a.email}\n`;
        }

        // ---- TEACHERS ----
        const [teachers]: any = await pool.query(`
            SELECT
                u.email,
                t.full_name,
                t.phone,
                GROUP_CONCAT(DISTINCT CONCAT(c.grade, '-', c.section) ORDER BY c.grade, c.section SEPARATOR ', ') AS classes_assigned
            FROM users u
            JOIN teachers t ON u.id = t.user_id
            LEFT JOIN timetable tt ON tt.teacher_id = t.id
            LEFT JOIN classes c ON tt.class_id = c.id
            GROUP BY u.email, t.full_name, t.phone
            ORDER BY t.full_name
        `);

        output += '\n\n╔══════════════════════════════════════════════════════════════╗\n';
        output += '║                      TEACHERS                               ║\n';
        output += '╚══════════════════════════════════════════════════════════════╝\n';
        output += `  ${'Name'.padEnd(28)} ${'Email'.padEnd(38)} ${'Phone'.padEnd(15)} Classes\n`;
        output += `  ${'-'.repeat(28)} ${'-'.repeat(38)} ${'-'.repeat(15)} ${'-'.repeat(20)}\n`;
        for (const t of teachers) {
            output += `  ${(t.full_name || '').padEnd(28)} ${(t.email || '').padEnd(38)} ${(t.phone || '').padEnd(15)} ${t.classes_assigned || 'Not assigned'}\n`;
        }

        // ---- STUDENTS ----
        const [students]: any = await pool.query(`
            SELECT
                u.email AS student_email,
                s.full_name AS student_name,
                s.roll_number,
                CONCAT(c.grade, '-', c.section) AS class_name,
                p.full_name AS parent_name,
                pu.email AS parent_email
            FROM users u
            JOIN students s ON u.id = s.user_id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN parents p ON s.parent_id = p.id
            LEFT JOIN users pu ON p.user_id = pu.id
            ORDER BY c.grade, c.section, s.full_name
        `);

        output += '\n\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗\n';
        output += '║                                        STUDENTS                                                    ║\n';
        output += '╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝\n';
        output += `  ${'Student Name'.padEnd(28)} ${'Student Email'.padEnd(38)} ${'Roll No'.padEnd(10)} ${'Class'.padEnd(8)} ${'Parent Name'.padEnd(25)} Parent Email\n`;
        output += `  ${'-'.repeat(28)} ${'-'.repeat(38)} ${'-'.repeat(10)} ${'-'.repeat(8)} ${'-'.repeat(25)} ${'-'.repeat(35)}\n`;
        for (const s of students) {
            output += `  ${(s.student_name || '').padEnd(28)} ${(s.student_email || '').padEnd(38)} ${(s.roll_number || '').padEnd(10)} ${(s.class_name || '').padEnd(8)} ${(s.parent_name || '').padEnd(25)} ${s.parent_email || 'N/A'}\n`;
        }

        output += '\n\n=============================================================\n';
        output += `  Total Admins: ${admins.length}  |  Total Teachers: ${teachers.length}  |  Total Students: ${students.length}\n`;
        output += '=============================================================\n';

        fs.writeFileSync('mock_users_report.txt', output);
        console.log('\n✅ Report written to: mock_users_report.txt');
        console.log(`   Admins: ${admins.length} | Teachers: ${teachers.length} | Students: ${students.length}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

getMockUsers();
