import { pool } from '../src/config/database';

async function testDashboard() {
    const results: any = {};
    const errors: any = {};

    const queries: Record<string, string> = {
        students: 'SELECT COUNT(*) as count FROM students',
        teachers: 'SELECT COUNT(*) as count FROM teachers',
        parents: 'SELECT COUNT(*) as count FROM parents',
        attendance: `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present FROM attendance WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        pendingLeaves: `SELECT COUNT(*) as count FROM teacher_leaves WHERE status = 'pending'`,
        announcements: `SELECT id, title, message, posted_by, posted_at FROM announcements ORDER BY posted_at DESC LIMIT 3`,
        exams: `SELECT e.id, e.title, e.exam_date, s.subject_name, c.grade, c.section FROM exams e JOIN subjects s ON e.subject_id = s.id JOIN classes c ON e.class_id = c.id WHERE e.exam_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND e.status = 'published' ORDER BY e.exam_date ASC LIMIT 5`,
        certs: `SELECT COUNT(*) as count FROM certificate_issue WHERE MONTH(issue_date) = MONTH(CURDATE()) AND YEAR(issue_date) = YEAR(CURDATE())`,
        events: `SELECT id, title, description, event_date FROM events WHERE event_date >= CURDATE() ORDER BY event_date ASC LIMIT 3`,
        attendance_chart: `SELECT DATE_FORMAT(date, '%Y-%m-%d') as day, DATE_FORMAT(date, '%d %b') as label, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present, SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent, SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late FROM attendance WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE_FORMAT(date, '%Y-%m-%d'), DATE_FORMAT(date, '%d %b') ORDER BY day ASC`,
    };

    for (const [key, sql] of Object.entries(queries)) {
        try {
            const [rows]: any = await pool.query(sql);
            results[key] = rows;
            console.log(`✅ ${key}: OK (${Array.isArray(rows) ? rows.length + ' rows' : JSON.stringify(rows[0])})`);
        } catch (e: any) {
            errors[key] = e.message;
            console.error(`❌ ${key}: ${e.message}`);
        }
    }

    console.log('\n--- Summary ---');
    console.log('OK:', Object.keys(results).join(', '));
    if (Object.keys(errors).length) console.log('ERRORS:', errors);

    await pool.end();
}

testDashboard();
