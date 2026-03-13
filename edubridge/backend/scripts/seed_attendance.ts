import { pool } from '../src/config/database';

async function main() {
    console.log("🧹 Clearing old attendance...");
    await pool.query('DELETE FROM attendance');
    await pool.query('ALTER TABLE attendance AUTO_INCREMENT = 1');

    console.log("📅 Seeding historical attendance (last 20 school days)...");

    const [students]: any = await pool.query('SELECT id, class_id FROM students');
    const [timetable]: any = await pool.query('SELECT id, class_id, day_of_week FROM timetable');

    const timetableByDay: Record<string, any[]> = {
        'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': []
    };
    for (const t of timetable) {
        if (timetableByDay[t.day_of_week]) {
            timetableByDay[t.day_of_week].push(t);
        }
    }

    const studentsByClass: Record<number, number[]> = {};
    for (const s of students) {
        if (!studentsByClass[s.class_id]) studentsByClass[s.class_id] = [];
        studentsByClass[s.class_id].push(s.id);
    }

    const attendanceRecords: any[] = [];
    const now = new Date();

    // Seed for last 28 days (to get about 20 school days)
    for (let i = 28; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        if (timetableByDay[dayName]) {
            const slots = timetableByDay[dayName];
            for (const slot of slots) {
                const classStudents = studentsByClass[slot.class_id] || [];
                for (const studentId of classStudents) {
                    const rand = Math.random();
                    let status = 'present';
                    if (rand > 0.95) status = 'absent';
                    else if (rand > 0.92) status = 'late';

                    attendanceRecords.push([studentId, status, date.toISOString().split('T')[0], slot.id]);
                }
            }
        }

        // Periodically flush to avoid memory issues and massive inserts
        if (attendanceRecords.length > 5000) {
            await insertBatch(attendanceRecords);
            attendanceRecords.length = 0;
        }
    }

    if (attendanceRecords.length > 0) {
        await insertBatch(attendanceRecords);
    }

    console.log("✅ Attendance seeding complete!");
    await pool.end();
}

async function insertBatch(batch: any[]) {
    await pool.query(
        'INSERT INTO attendance (student_id, status, date, timetable_id) VALUES ?',
        [batch]
    );
}

main().catch(console.error);
