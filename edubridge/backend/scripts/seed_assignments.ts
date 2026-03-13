import { pool } from '../src/config/database';

function studentBase(): number {
    return Math.floor(Math.random() * 45) + 50;
}

function getSubjectIdsForStudent(studentId: number, gradeStr: string): number[] {
    const match = gradeStr.match(/Grade\s+(\d+)/i);
    if (!match) return [];
    const gradeNum = parseInt(match[1]);

    if (gradeNum >= 1 && gradeNum <= 5) {
        return [1, 2, 17, 5, 18];
    } else if (gradeNum >= 6 && gradeNum <= 11) {
        const core = [1, 5, 2, 3, 4, 18, 8, 7];
        const optionals = [13, 12, 19, 11];
        const opt = optionals[studentId % optionals.length];
        return [...core, opt];
    } else if (gradeNum === 12 || gradeNum === 13) {
        const core = [15, 14, 5];
        const alts = [2, 16];
        const alt = alts[studentId % alts.length];
        return [...core, alt];
    }
    return [];
}

async function main() {
    console.log("🧹 Clearing old assignments and marks...");
    await pool.query('DELETE FROM assignment_marks');
    await pool.query('DELETE FROM assignment_submissions');
    await pool.query('DELETE FROM assignments');
    await pool.query('ALTER TABLE assignments AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE assignment_submissions AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE assignment_marks AUTO_INCREMENT = 1');

    console.log("📝 Seeding assignments and marks...");

    const [classesRow]: any = await pool.query('SELECT id, grade FROM classes');
    const [studentsRow]: any = await pool.query('SELECT id, class_id FROM students');
    const [teachersRow]: any = await pool.query('SELECT user_id, subject_id FROM teachers');

    const teachersBySubject: Record<number, number[]> = {};
    for (const t of teachersRow) {
        if (!teachersBySubject[t.subject_id]) teachersBySubject[t.subject_id] = [];
        teachersBySubject[t.subject_id].push(t.user_id);
    }

    const studentsByClass: Record<number, any[]> = {};
    for (const s of studentsRow) {
        if (!studentsByClass[s.class_id]) studentsByClass[s.class_id] = [];
        studentsByClass[s.class_id].push(s);
    }

    const studentAbility: Record<number, number> = {};
    for (const s of studentsRow) {
        studentAbility[s.id] = studentBase();
    }

    const types = ['Unit Test', 'Assignment 1', 'Quick Quiz'];

    for (const cls of classesRow) {
        const clsStudents = studentsByClass[cls.id] || [];
        if (clsStudents.length === 0) continue;

        // Pick subjects for a representative student in this class
        const subjectIds = getSubjectIdsForStudent(clsStudents[0].id, cls.grade);

        for (const subjectId of subjectIds) {
            // Get a teacher for this subject
            const subjectTeachers = teachersBySubject[subjectId] || [];
            if (subjectTeachers.length === 0) {
                console.warn(`No teacher found for subject ${subjectId}, skipping assignments.`);
                continue;
            }
            const teacherId = subjectTeachers[0]; // Just pick the first one

            for (const type of types) {
                const title = `${type} - ${cls.grade}`;
                const description = `Mock ${type} for the current term.`;

                const [asgnResult]: any = await pool.query(
                    'INSERT INTO assignments (title, description, class_id, subject_id, created_by, due_date) VALUES (?, ?, ?, ?, ?, NOW())',
                    [title, description, cls.id, subjectId, teacherId]
                );
                const assignmentId = asgnResult.insertId;

                for (const student of clsStudents) {
                    // Check if this student actually takes this subject (relevant for ALTs/Optionals)
                    const studentSubjectIds = getSubjectIdsForStudent(student.id, cls.grade);
                    if (!studentSubjectIds.includes(subjectId)) continue;

                    const [subResult]: any = await pool.query(
                        'INSERT INTO assignment_submissions (assignment_id, student_id, submission_file_url) VALUES (?, ?, ?)',
                        [assignmentId, student.id, '']
                    );
                    const submissionId = subResult.insertId;

                    const base = studentAbility[student.id];
                    const mark = Math.min(100, Math.max(20, base + Math.floor(Math.random() * 21) - 10));

                    await pool.query(
                        'INSERT INTO assignment_marks (assignment_submission_id, marks, feedback) VALUES (?, ?, ?)',
                        [submissionId, mark, 'Mock feedback']
                    );
                }
            }
        }
    }

    console.log("✅ Assignment seeding complete!");
    await pool.end();
}

main().catch(console.error);
