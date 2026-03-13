/**
 * seed_marks.ts
 * Seeds realistic mock marks for all students:
 *   - Term marks: 3 terms × all subjects taught in each student's class (via timetable)
 *   - Assignment marks: all existing assignments for each class
 * Skips already-existing records (upsert approach).
 * After seeding, recalculates class ranks for all classes.
 */
import { pool } from '../src/config/database';
import { recalculateClassRanks } from '../src/services/RankService';

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

function randMark(min = 40, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function studentBase(): number {
    return Math.floor(Math.random() * 45) + 50;
}

function getSubjectIdsForStudent(studentId: number, gradeStr: string): number[] {
    const match = gradeStr.match(/Grade\s+(\d+)/i);
    if (!match) return [];
    const gradeNum = parseInt(match[1]);

    // grade 1-5 studnets have subjects tamil(1), maths(2), Environmental Studies(17), english(5) and religion(18)
    if (gradeNum >= 1 && gradeNum <= 5) {
        return [1, 2, 17, 5, 18];
        // grade 6-11 students have tamil(1), English(5), Maths(2), Science(3), History(4), Religion(18), civics(8), geography(7)
        // and optional (Drama(13), Music(12), Art(19), dance(11))
    } else if (gradeNum >= 6 && gradeNum <= 11) {
        const core = [1, 5, 2, 3, 4, 18, 8, 7];
        const optionals = [13, 12, 19, 11];
        const opt = optionals[studentId % optionals.length];
        return [...core, opt];
        // for grade 12, 13 maths(2) or biology(16), chemistry(15), physics(14), english(5)
    } else if (gradeNum === 12 || gradeNum === 13) {
        const core = [15, 14, 5];
        const alts = [2, 16];
        const alt = alts[studentId % alts.length];
        return [...core, alt];
    }
    return [];
}

async function main() {
    console.log('🗑️ Clearing old mock marks...');
    await pool.query("DELETE FROM term_marks WHERE feedback = 'Mock data'");
    await pool.query("ALTER TABLE term_marks AUTO_INCREMENT = 1");

    await pool.query("DELETE FROM assignment_marks WHERE feedback = 'Mock grading'");
    await pool.query("ALTER TABLE assignment_marks AUTO_INCREMENT = 1");

    // 1. Get all students with class_id
    const [students]: any = await pool.query('SELECT id, class_id FROM students ORDER BY id');
    console.log(`Found ${students.length} students.`);

    // 2. Get classes to map class_id -> grade string
    const [classes]: any = await pool.query('SELECT id, grade FROM classes');
    const classGradeMap: Record<number, string> = {};
    for (const c of classes) {
        classGradeMap[c.id] = c.grade;
    }

    // 4. Assign a stable base ability per student (deterministic from id)
    const studentAbility: Record<number, number> = {};
    for (const s of students) {
        studentAbility[s.id] = studentBase();
    }

    // ─── Term Marks ───
    console.log('\n📚 Seeding term marks...');
    let tmInserted = 0, tmSkipped = 0;

    for (const student of students) {
        const gradeStr = classGradeMap[student.class_id] || '';
        const subjectIds = getSubjectIdsForStudent(student.id, gradeStr);
        const base = studentAbility[student.id];

        for (const subjectId of subjectIds) {
            for (const term of TERMS) {
                const mark = Math.min(100, Math.max(20, base + Math.floor(Math.random() * 21) - 10));
                await pool.query(
                    'INSERT INTO term_marks (student_id, subject_id, term, marks, feedback) VALUES (?, ?, ?, ?, ?)',
                    [student.id, subjectId, term, mark, 'Mock data']
                );
                tmInserted++;
            }
        }
    }
    console.log(`  ✅ Term marks: ${tmInserted} inserted`);

    // ─── Assignment Marks ───
    console.log('\n📝 Seeding assignment marks...');
    // Only get assignments with a valid subject_id
    const [assignments]: any = await pool.query('SELECT id, class_id, subject_id FROM assignments');
    let amInserted = 0, amSkipped = 0;

    for (const assignment of assignments) {
        const classStudents = students.filter((s: any) => s.class_id === assignment.class_id);

        for (const student of classStudents) {
            const gradeStr = classGradeMap[student.class_id] || '';
            const studentSubjectIds = getSubjectIdsForStudent(student.id, gradeStr);

            // Only mock grades for assignments in subjects the student actually takes
            if (!studentSubjectIds.includes(assignment.subject_id)) {
                continue;
            }

            // Ensure submission exists
            const [sub]: any = await pool.query(
                'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
                [assignment.id, student.id]
            );

            let submissionId: number;
            if (sub.length > 0) {
                submissionId = sub[0].id;
            } else {
                const [ins]: any = await pool.query(
                    `INSERT INTO assignment_submissions (assignment_id, student_id, submission_file_url) VALUES (?, ?, '')`,
                    [assignment.id, student.id]
                );
                submissionId = ins.insertId;
            }

            const base = studentAbility[student.id];
            const mark = Math.min(100, Math.max(20, base + Math.floor(Math.random() * 21) - 10));

            // Just insert since we cleared them
            await pool.query(
                'INSERT INTO assignment_marks (assignment_submission_id, marks, feedback) VALUES (?, ?, ?)',
                [submissionId, mark, 'Mock grading']
            );
            amInserted++;
        }
    }
    console.log(`  ✅ Assignment marks: ${amInserted} inserted`);

    // ─── Recalculate all class ranks ───
    console.log('\n🔢 Recalculating class ranks...');
    for (const cls of classes) {
        try {
            await recalculateClassRanks(cls.id);
        } catch (e: any) {
            console.error(`  ⚠️  Class ${cls.id}: ${e.message}`);
        }
    }
    console.log(`  ✅ Ranks updated for ${classes.length} classes`);

    // ─── Summary ───
    const [tmTotal]: any = await pool.query('SELECT COUNT(*) as c FROM term_marks');
    const [amTotal]: any = await pool.query('SELECT COUNT(*) as c FROM assignment_marks');
    const [rankSample]: any = await pool.query(
        'SELECT full_name, class_id, class_rank FROM students WHERE class_rank IS NOT NULL ORDER BY class_id, class_rank LIMIT 10'
    );

    console.log(`\n📊 Final counts:`);
    console.log(`   term_marks total: ${tmTotal[0].c}`);
    console.log(`   assignment_marks total: ${amTotal[0].c}`);
    console.log(`\n🏆 Sample rankings:`);
    rankSample.forEach((s: any) => console.log(`   ${s.full_name} (class ${s.class_id}) => Rank #${s.class_rank}`));

    await pool.end();
    console.log('\nDone! ✅');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
