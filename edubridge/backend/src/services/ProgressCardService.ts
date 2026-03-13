import { pool } from '../config/database';

export class ProgressCardService {
    async getTermProgressCard(studentId: number, term: string) {
        // 1. Get Student Info
        const [studentRows]: any = await pool.query(`
            SELECT 
                s.id, s.full_name, s.roll_number,

                c.grade, c.section, CONCAT(c.grade, ' ', c.section) as class_name,
                s.class_id
            FROM students s
            JOIN classes c ON s.class_id = c.id
            WHERE s.id = ?
        `, [studentId]);

        if (studentRows.length === 0) throw new Error('Student not found');
        const student = studentRows[0];

        // 2. Get Term Marks for the specific term
        const [termMarks]: any = await pool.query(`
            SELECT 
                sub.id as subject_id,
                sub.subject_name,
                tm.marks as term_mark
            FROM term_marks tm
            JOIN subjects sub ON tm.subject_id = sub.id
            WHERE tm.student_id = ? AND tm.term = ?
        `, [studentId, term]);

        // 3. Get Assignment Marks (CA component 1)
        const [assignmentMarks]: any = await pool.query(`
            SELECT 
                a.subject_id,
                AVG(am.marks) as avg_assignment_mark
            FROM assignment_marks am
            JOIN assignment_submissions sub ON am.assignment_submission_id = sub.id
            JOIN assignments a ON sub.assignment_id = a.id
            WHERE sub.student_id = ?
            GROUP BY a.subject_id
        `, [studentId]);

        // 4. Get Online Exam Marks (CA component 2)
        const [examMarks]: any = await pool.query(`
            SELECT 
                e.subject_id,
                AVG(ExamScores.score) as avg_exam_mark
            FROM (
                SELECT sea.id as attempt_id, sea.exam_id,
                    SUM(
                        CASE
                            WHEN qb.question_type IN ('multiple_choice', 'true_false')
                                AND ans.selected_option COLLATE utf8mb4_general_ci = qb.correct_answer COLLATE utf8mb4_general_ci THEN qb.marks
                            WHEN qb.question_type = 'short_answer'
                                AND ans.text_answer IS NOT NULL
                                AND LOWER(ans.text_answer) COLLATE utf8mb4_general_ci LIKE CONCAT('%', LOWER(qb.correct_answer) COLLATE utf8mb4_general_ci, '%') THEN qb.marks
                            ELSE 0
                        END
                    ) as score
                FROM student_exam_attempts sea
                JOIN student_exam_answers ans ON sea.id = ans.attempt_id
                JOIN question_bank qb ON ans.question_id = qb.id
                WHERE sea.student_id = ? AND sea.status IN ('submitted', 'evaluated')
                GROUP BY sea.id, sea.exam_id
            ) ExamScores
            JOIN exams e ON ExamScores.exam_id = e.id
            GROUP BY e.subject_id
        `, [studentId]);

        // Create Maps for easy CA lookup
        const caAssignmentMap = new Map(assignmentMarks.map((a: any) => [a.subject_id, a.avg_assignment_mark]));
        const caExamMap = new Map(examMarks.map((e: any) => [e.subject_id, e.avg_exam_mark]));

        // Combine into Final Marks
        let totalSum = 0;
        let totalCount = 0;

        const combinedMarks = termMarks.map((tm: any) => {
            const assignMark = caAssignmentMap.get(tm.subject_id);
            const exMark = caExamMap.get(tm.subject_id);

            // Average assignment and online exams for Continuous Assessment (CA)
            let ca_mark = 0;
            if (assignMark != null && exMark != null) ca_mark = (Number(assignMark) + Number(exMark)) / 2;
            else if (assignMark != null) ca_mark = Number(assignMark);
            else if (exMark != null) ca_mark = Number(exMark);

            const term_mark = Number(tm.term_mark);

            // Total Mark calculation: Sri Lankan pattern often uses 80% term mark, 20% CA
            // Or simple addition if marks are out of different weights.
            // Let's use standard (Term * 0.8) + (CA * 0.2) or just use Term Mark if CA is 0
            let total_mark = term_mark;
            if (ca_mark > 0) {
                total_mark = Math.round((term_mark * 0.8) + (ca_mark * 0.2));
            }

            // Grading System (Sri Lankan scale)
            // A: 75-100, B: 65-74, C: 50-64, S: 35-49, W: 0-34
            let gradeLetter = 'W';
            if (total_mark >= 75) gradeLetter = 'A';
            else if (total_mark >= 65) gradeLetter = 'B';
            else if (total_mark >= 50) gradeLetter = 'C';
            else if (total_mark >= 35) gradeLetter = 'S';

            totalSum += total_mark;
            totalCount++;

            return {
                subject_name: tm.subject_name,
                term_mark,
                ca_mark: Math.round(ca_mark),
                total_mark,
                grade: gradeLetter
            };
        });

        const overall_average = totalCount > 0 ? Math.round(totalSum / totalCount) : 0;

        // 5. Term Rank Calculation
        // Compares the student's SUM(term_marks) for this specific term against others in their class
        const [rankRow]: any = await pool.query(`
            WITH ClassTermMarks AS (
                SELECT 
                    tm.student_id,
                    SUM(tm.marks) as total_marks
                FROM term_marks tm
                JOIN students s ON tm.student_id = s.id
                WHERE tm.term = ? AND s.class_id = ?
                GROUP BY tm.student_id
            ),
            Ranks AS (
                SELECT 
                    student_id,
                    RANK() OVER (ORDER BY total_marks DESC) as term_rank
                FROM ClassTermMarks
            )
            SELECT term_rank FROM Ranks WHERE student_id = ?
        `, [term, student.class_id, studentId]);

        const term_rank = rankRow.length > 0 ? rankRow[0].term_rank : 'N/A';


        // 6. Attendance
        const [attendanceStats]: any = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            FROM attendance
            WHERE student_id = ?
        `, [studentId]);

        const attendance_percentage = attendanceStats[0].total > 0
            ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
            : 0;

        return {
            student,
            marks: combinedMarks,
            summary: {
                total_marks: totalSum,
                average: overall_average,
                term_rank,
                attendance_percentage
            }
        };
    }
}

export const progressCardService = new ProgressCardService();
