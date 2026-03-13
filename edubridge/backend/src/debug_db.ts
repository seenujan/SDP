
import { pool } from './config/database';

async function debug() {
    try {
        const userId = 5; // Mohan
        
        // Check Mohan's teacher profile
        const [mohanProfile]: any = await pool.query("SELECT * FROM teachers WHERE user_id = ?", [userId]);
        console.log('Mohan Teacher Profile:', mohanProfile);

        // Check all teachers and their user IDs
        const [allTs]: any = await pool.query(`
            SELECT t.id as teacher_table_id, t.user_id, t.full_name, u.email 
            FROM teachers t
            JOIN users u ON t.user_id = u.id
        `);
        console.log('All Teachers in DB:', allTs);

        // Check subjects join from timetable (current implementation)
        const [subjectsTimetable]: any = await pool.query(`
            SELECT DISTINCT s.* 
            FROM subjects s
            JOIN timetable t ON t.subject_id = s.id
            WHERE t.teacher_id = ?
        `, [userId]);
        console.log('Subjects from Timetable:', subjectsTimetable);

        // Check subjects join from teacher profile (previous implementation)
        const [subjectsProfile]: any = await pool.query(`
            SELECT s.* 
            FROM subjects s
            JOIN teachers t ON t.subject_id = s.id
            WHERE t.user_id = ?
        `, [userId]);
        console.log('Subjects from Profile:', subjectsProfile);

        process.exit(0);
    } catch (e) {
        console.error('Debug failed:', e);
        process.exit(1);
    }
}

debug();
