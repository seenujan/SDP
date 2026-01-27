
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function refactorAttendance() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Refactoring attendance table...');

        // 1. Add timetable_id column
        console.log('Adding timetable_id column...');
        await connection.query('ALTER TABLE attendance ADD COLUMN timetable_id INT');

        // 2. Migrate data
        console.log('Migrating existing attendance data...');

        // We need to map existing attendance (date, class_id, subject_id) to timetable_id
        // Timetable has day_of_week. We need to calculate day_of_week from attendance.date

        const [attendanceRecords]: any = await connection.query('SELECT id, date, class_id, subject_id FROM attendance');

        for (const record of attendanceRecords) {
            const date = new Date(record.date);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = days[date.getDay()];

            // Find matching timetable entry
            // Note: Timetable might have multiple slots for same subject/class on same day (rare but possible).
            // We'll just pick the first one matching subject/class/day.
            // If we wanted to be more precise we'd need time, but we don't track time in attendance currently?
            // Actually attendance table doesn't have time. Timetable does.
            // This is a best-effort migration.

            const [timetableEntries]: any = await connection.query(
                'SELECT id FROM timetable WHERE class_id = ? AND subject_id = ? AND day_of_week = ? LIMIT 1',
                [record.class_id, record.subject_id, dayOfWeek]
            );

            if (timetableEntries.length > 0) {
                await connection.query(
                    'UPDATE attendance SET timetable_id = ? WHERE id = ?',
                    [timetableEntries[0].id, record.id]
                );
            } else {
                console.warn(`No timetable entry found for attendance id ${record.id} (Date: ${record.date}, Day: ${dayOfWeek}, Class: ${record.class_id}, Subject: ${record.subject_id})`);
                // If no timetable entry, we might lose this link. Ideally we should have one.
                // For now, we proceed. It might mean old data becomes inaccessible if we strictly require timetable_id.
            }
        }

        // 3. Drop old columns
        console.log('Dropping old columns...');
        // First drop FKs if they exist.
        // We need to check constraint names.

        const [fks]: any = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'attendance' 
            AND COLUMN_NAME IN ('class_id', 'subject_id')
            AND TABLE_SCHEMA = '${process.env.DB_NAME || 'edubridge'}'
        `);

        for (const fk of fks) {
            // Avoid duplicate drops if constraint covers multiple columns (unlikely for simple FKs usually)
            try {
                console.log(`Dropping FK: ${fk.CONSTRAINT_NAME}`);
                await connection.query(`ALTER TABLE attendance DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
            } catch (e: any) {
                console.log(`Failed to drop FK ${fk.CONSTRAINT_NAME}: ${e.message}`);
            }
        }

        // Now drop columns
        await connection.query('ALTER TABLE attendance DROP COLUMN class_id');
        await connection.query('ALTER TABLE attendance DROP COLUMN subject_id');

        // 4. Add FK constraint
        console.log('Adding FK constraint for timetable_id...');
        await connection.query('ALTER TABLE attendance ADD CONSTRAINT fk_attendance_timetable FOREIGN KEY (timetable_id) REFERENCES timetable(id)');

        console.log('Attendance refactor complete.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

refactorAttendance();
