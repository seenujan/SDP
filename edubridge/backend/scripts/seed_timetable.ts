import { pool } from '../src/config/database';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
    { start: '08:00:00', end: '08:40:00' },
    { start: '08:40:00', end: '09:20:00' },
    { start: '09:20:00', end: '10:00:00' },
    { start: '10:00:00', end: '10:40:00' },
    // 10:40 - 11:00 is interval (skipped)
    { start: '11:00:00', end: '11:40:00' },
    { start: '11:40:00', end: '12:20:00' },
    { start: '12:20:00', end: '13:00:00' },
    { start: '13:00:00', end: '13:40:00' },
];

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
    console.log("🚀 Starting Timetable Generation...");

    // 1. Load Classes
    const [classesRow]: any = await pool.query('SELECT id, grade, section FROM classes ORDER BY id');

    // 2. Load Teachers mapping: subject_id -> array of user_ids (schema requires teacher_id to map to users.id)
    const [teachersRow]: any = await pool.query('SELECT user_id, subject_id FROM teachers');
    const subjectTeachers: Record<number, number[]> = {};
    for (const t of teachersRow) {
        if (!subjectTeachers[t.subject_id]) subjectTeachers[t.subject_id] = [];
        subjectTeachers[t.subject_id].push(t.user_id);
    }

    // Initialize grid for tracking clashes: day -> period_idx -> { classClashes, teacherClashes }
    const schedule: any[] = []; // final schedule flat array

    // Tracking capacities manually per teacher to avoid overloading
    const teacherLoad: Record<number, number> = {};
    for (const t of teachersRow) teacherLoad[t.id] = 0;

    // Helper: find an available teacher for a given subject at a specific timeslot that isn't already busy
    function getAvailableTeacher(subjectId: number, day: string, pIdx: number, teacherClashesMap: any) {
        const potentialTeachers = subjectTeachers[subjectId] || [];
        // Sort by least loaded first (greedy balance)
        potentialTeachers.sort((a, b) => teacherLoad[a] - teacherLoad[b]);

        for (const tid of potentialTeachers) {
            if (!teacherClashesMap[day][pIdx].has(tid)) {
                return tid;
            }
        }
        return null;
    }

    const teacherClashesMap: any = {};
    const classClashesMap: any = {};

    for (const day of DAYS) {
        teacherClashesMap[day] = {};
        classClashesMap[day] = {};
        for (let i = 0; i < PERIODS.length; i++) {
            teacherClashesMap[day][i] = new Set();
            classClashesMap[day][i] = new Set();
        }
    }

    await pool.query("DELETE FROM timetable");

    // Assign periods per class
    for (const cls of classesRow) {
        console.log(`Scheduling Class ${cls.id} (${cls.grade} ${cls.section})...`);
        const match = cls.grade.match(/Grade\s+(\d+)/i);
        if (!match) continue;
        const gradeNum = parseInt(match[1]);

        let scheme = '';
        if (gradeNum >= 1 && gradeNum <= 5) scheme = 'Grades 1-5';
        else if (gradeNum >= 6 && gradeNum <= 11) scheme = 'Grades 6-11';
        else if (gradeNum >= 12 && gradeNum <= 13) scheme = 'Grades 12-13';

        const reqs = { ...SUBJECT_PERIODS[scheme] };

        // Group subjects for concurrent scheduling
        // Grades 6-11: 13, 12, 19, 11 should be scheduled AT THE SAME TIME for this class
        // Grades 12-13: 2, 16 should be scheduled AT THE SAME TIME

        const coreSubjects = [];
        const concurrentGroups = [];

        if (scheme === 'Grades 1-5') {
            for (const subj of [1, 2, 17, 5, 18]) {
                if (reqs[subj]) coreSubjects.push({ id: subj, periods: reqs[subj] });
            }
        } else if (scheme === 'Grades 6-11') {
            for (const subj of [1, 5, 2, 3, 4, 18, 8, 7]) {
                if (reqs[subj]) coreSubjects.push({ id: subj, periods: reqs[subj] });
            }
            concurrentGroups.push({ group: [13, 12, 19, 11], periods: reqs[13] });
        } else if (scheme === 'Grades 12-13') {
            for (const subj of [15, 14, 5]) {
                if (reqs[subj]) coreSubjects.push({ id: subj, periods: reqs[subj] });
            }
            concurrentGroups.push({ group: [2, 16], periods: reqs[2] });
        }

        // We fill up the grid for this specific class
        const totalPeriods = DAYS.length * PERIODS.length; // 40
        const availableSlots = [];
        for (const day of DAYS) {
            for (let i = 0; i < PERIODS.length; i++) {
                availableSlots.push({ day, pIdx: i });
            }
        }

        // Shuffle slots to randomize timetable
        for (let i = availableSlots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
        }

        // 1. Schedule Concurrent Groups first (hardest constraints)
        for (const cg of concurrentGroups) {
            let placed = 0;
            for (const slot of availableSlots) {
                if (placed >= cg.periods) break;
                if (classClashesMap[slot.day][slot.pIdx].has(cls.id)) continue;

                // Check if ALL teachers for concurrent subjects are available
                const assignedTeachers = [];
                let canPlace = true;
                for (const subj of cg.group) {
                    const tid = getAvailableTeacher(subj, slot.day, slot.pIdx, teacherClashesMap);
                    if (!tid) {
                        canPlace = false;
                        break;
                    }
                    assignedTeachers.push({ subj, tid });
                }

                if (canPlace) {
                    // Mark slots
                    classClashesMap[slot.day][slot.pIdx].add(cls.id);
                    for (const at of assignedTeachers) {
                        teacherClashesMap[slot.day][slot.pIdx].add(at.tid);
                        teacherLoad[at.tid]++;

                        schedule.push({
                            class_id: cls.id,
                            day_of_week: slot.day,
                            start_time: PERIODS[slot.pIdx].start,
                            end_time: PERIODS[slot.pIdx].end,
                            teacher_id: at.tid,
                            subject_id: at.subj
                        });
                    }
                    placed++;
                }
            }
            if (placed < cg.periods) console.warn(`  ⚠️ Could not place all concurrent periods for Grade ${gradeNum}. Only placed ${placed}/${cg.periods}`);
        }

        // 2. Schedule Core Subjects
        for (const core of coreSubjects) {
            let placed = 0;
            for (const slot of availableSlots) {
                if (placed >= core.periods) break;
                if (classClashesMap[slot.day][slot.pIdx].has(cls.id)) continue;

                // Avoid back-to-back same subject natively (optional optimization skipped for speed)

                const tid = getAvailableTeacher(core.id, slot.day, slot.pIdx, teacherClashesMap);
                if (tid) {
                    classClashesMap[slot.day][slot.pIdx].add(cls.id);
                    teacherClashesMap[slot.day][slot.pIdx].add(tid);
                    teacherLoad[tid]++;

                    schedule.push({
                        class_id: cls.id,
                        day_of_week: slot.day,
                        start_time: PERIODS[slot.pIdx].start,
                        end_time: PERIODS[slot.pIdx].end,
                        teacher_id: tid,
                        subject_id: core.id
                    });
                    placed++;
                }
            }
            if (placed < core.periods) console.warn(`  ⚠️ Could not place all ${core.id} periods for Grade ${gradeNum}. Placed ${placed}/${core.periods}`);
        }
    }

    console.log(`Writing ${schedule.length} records to database...`);

    // Bulk insert the schedule
    // Chunks of 500 to avoid packet size issues
    const chunkSize = 500;
    for (let i = 0; i < schedule.length; i += chunkSize) {
        const chunk = schedule.slice(i, i + chunkSize);
        const values = chunk.map(s => [s.class_id, s.day_of_week, s.start_time, s.end_time, s.teacher_id, s.subject_id]);
        await pool.query('INSERT INTO timetable (class_id, day_of_week, start_time, end_time, teacher_id, subject_id) VALUES ?', [values]);
    }

    console.log("✅ Timetable Generation Complete!");

    await pool.end();
}

main().catch(console.error);
