import { pool } from '../src/config/database';
import bcrypt from 'bcryptjs';

const TOTAL_CLASSES_PER_GRADE: Record<number, number> = {
    1: 2, 2: 2, 3: 2, 4: 2, 5: 2, // 10 classes
    6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, // 12 classes
    12: 2, 13: 2 // 4 classes
};

// Based on the curriculum
const SUBJECT_PERIODS: Record<string, Record<number, number>> = {
    'Grades 1-5': { 1: 7, 2: 7, 17: 7, 5: 7, 18: 7 }, // Tamil, Maths, Env, English, Religion (7*5=35 periods)
    'Grades 6-11': {
        1: 4, 5: 4, 2: 4, 3: 4, 4: 4, 18: 4, 8: 4, 7: 4, // Core: 32 periods
        // Optionals 13, 12, 19, 11 (Drama, Music, Art, Dance) run concurrently, 4 periods each
        13: 4, 12: 4, 19: 4, 11: 4
    },
    'Grades 12-13': {
        15: 9, 14: 9, 5: 9, // Chem, Phy, Eng (27 periods)
        // ALTs: 2 (Maths), 16 (Biology) run concurrently, 9 periods each
        2: 9, 16: 9
    }
};

async function main() {
    console.log("📊 Calculating required teacher capacity...");

    const requiredPeriodsPerSubject: Record<number, number> = {};

    // Grades 1-5
    for (let g = 1; g <= 5; g++) {
        const classesCount = TOTAL_CLASSES_PER_GRADE[g];
        for (const [subj, periods] of Object.entries(SUBJECT_PERIODS['Grades 1-5'])) {
            requiredPeriodsPerSubject[Number(subj)] = (requiredPeriodsPerSubject[Number(subj)] || 0) + (periods * classesCount);
        }
    }

    // Grades 6-11
    for (let g = 6; g <= 11; g++) {
        const classesCount = TOTAL_CLASSES_PER_GRADE[g];
        for (const [subj, periods] of Object.entries(SUBJECT_PERIODS['Grades 6-11'])) {
            requiredPeriodsPerSubject[Number(subj)] = (requiredPeriodsPerSubject[Number(subj)] || 0) + (periods * classesCount);
        }
    }

    // Grades 12-13
    for (let g = 12; g <= 13; g++) {
        const classesCount = TOTAL_CLASSES_PER_GRADE[g];
        for (const [subj, periods] of Object.entries(SUBJECT_PERIODS['Grades 12-13'])) {
            requiredPeriodsPerSubject[Number(subj)] = (requiredPeriodsPerSubject[Number(subj)] || 0) + (periods * classesCount);
        }
    }

    // A single teacher can safely handle ~30 periods a week to make the algorithm easy (max 40)
    const MAX_PERIODS_PER_TEACHER = 32;

    const [allSubjects]: any = await pool.query('SELECT * FROM subjects');
    const [existingTeachers]: any = await pool.query(`
        SELECT subject_id, COUNT(id) as count 
        FROM teachers 
        GROUP BY subject_id
    `);

    const existingCountMap: Record<number, number> = {};
    for (const t of existingTeachers) {
        existingCountMap[t.subject_id] = t.count;
    }

    const hashedPassword = await bcrypt.hash('Password@123', 10);
    let teachersAdded = 0;

    for (const subj of allSubjects) {
        const requiredPeriods = requiredPeriodsPerSubject[subj.id] || 0;
        if (requiredPeriods === 0) continue; // Subject not used

        const existingCount = existingCountMap[subj.id] || 0;
        const requiredCount = Math.ceil(requiredPeriods / MAX_PERIODS_PER_TEACHER);

        if (existingCount < requiredCount) {
            const deficit = requiredCount - existingCount;
            console.log(`[${subj.subject_name}] Required periods: ${requiredPeriods}. Has ${existingCount} teachers. Adding ${deficit} more...`);

            for (let i = 0; i < deficit; i++) {
                const cleanName = subj.subject_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const email = `teacher_${cleanName}_extra${Math.floor(Math.random() * 1000)}@gmail.com`;
                const fullName = `Teacher ${subj.subject_name} Extra ${i + 1}`;

                const [userResult]: any = await pool.query(
                    'INSERT INTO users (email, password, role, active) VALUES (?, ?, ?, ?)',
                    [email, hashedPassword, 'teacher', 1]
                );
                const userId = userResult.insertId;

                await pool.query(
                    'INSERT INTO teachers (user_id, full_name, subject_id, phone) VALUES (?, ?, ?, ?)',
                    [userId, fullName, subj.id, 'N/A']
                );
                teachersAdded++;
            }
        } else {
            console.log(`[${subj.subject_name}] OK (${existingCount} >= ${requiredCount} needed)`);
        }
    }

    console.log(`\n✅ Finished! Added ${teachersAdded} new mock teachers to satisfy capacity.`);
    await pool.end();
}

main().catch(console.error);
