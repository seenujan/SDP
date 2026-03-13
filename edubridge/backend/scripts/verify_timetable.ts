import { pool } from '../src/config/database';

async function main() {
    console.log("🔍 Verifying timetable for clashes...");

    // 1. Check for Teacher Clashes
    // A teacher should not be scheduled for more than one class at the same time
    const [teacherClashes]: any = await pool.query(`
        SELECT teacher_id, day_of_week, start_time, COUNT(*) as occurs
        FROM timetable
        GROUP BY teacher_id, day_of_week, start_time
        HAVING occurs > 1
    `);

    if (teacherClashes.length > 0) {
        console.error("❌ Teacher Clashes Found!");
        console.log(teacherClashes);
    } else {
        console.log("✅ No Teacher Clashes.");
    }

    // 2. Check for Class Clashes
    // A class should not have more than one subject at the same time (except concurrent subjects)
    // Wait, concurrent subjects DO mean multiple records for the same class at the same time,
    // BUT they are optional/alternative subjects.
    // For our system, the frontend or backend might handle concurrents as multiple rows.
    // Let's just output them to manually review if they are intended concurrent groups.
    const [classConcurrents]: any = await pool.query(`
        SELECT t.class_id, c.grade, c.section, t.day_of_week, t.start_time, COUNT(*) as occurs, GROUP_CONCAT(s.subject_name) as subjects
        FROM timetable t
        JOIN classes c ON t.class_id = c.id
        JOIN subjects s ON t.subject_id = s.id
        GROUP BY t.class_id, t.day_of_week, t.start_time
        HAVING occurs > 1
    `);

    if (classConcurrents.length > 0) {
        console.log(`\nℹ️ Found ${classConcurrents.length} timeslots with concurrent subjects for a single class.`);
        const groupedByGrade: Record<string, string[]> = {};
        for (const cc of classConcurrents) {
            if (!groupedByGrade[cc.grade]) groupedByGrade[cc.grade] = [];
            groupedByGrade[cc.grade].push(cc.subjects);
        }

        // Print unique concurrent combinations per grade to verify they are correct
        for (const [grade, combos] of Object.entries(groupedByGrade)) {
            const uniqueCombos = [...new Set(combos)];
            console.log(`  ${grade} Concurrents: ${uniqueCombos.join(' | ')}`);
        }
    } else {
        console.log("✅ No Concurrent/Clashing subjects for any class.");
    }

    // 3. Count total periods
    const [total]: any = await pool.query('SELECT COUNT(*) as c FROM timetable');
    console.log(`\nTotal periods scheduled: ${total[0].c}`);

    await pool.end();
}

main().catch(console.error);
