import { pool } from '../config/database';

export class ReportService {
    // Get Attendance Report
    async getAttendanceReport(classId: number | null, startDate: string, endDate: string) {
        console.log('[ReportService] Generating Attendance Report', { classId, startDate, endDate });
        let dateCondition = '';
        const params: any[] = [];

        if (startDate && endDate) {
            dateCondition = 'AND a.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        let query = `
            SELECT 
                s.roll_number,
                s.full_name,
                c.grade,
                c.section,
                COUNT(a.id) as total_days,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days
            FROM students s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN attendance a ON s.id = a.student_id ${dateCondition}
        `;

        if (classId) {
            query += ' WHERE c.id = ?';
            params.push(classId);
        }

        query += ` GROUP BY s.id, c.grade, c.section, s.roll_number, s.full_name ORDER BY c.grade, c.section, s.roll_number`;

        const [rows]: any = await pool.query(query, params);

        // Calculate percentage
        return rows.map((row: any) => ({
            ...row,
            attendance_percentage: row.total_days > 0
                ? ((row.present_days / row.total_days) * 100).toFixed(1)
                : 0
        }));
    }

    // Get Exam Performance Report
    async getExamReport(grade: string | null, examId: number | null) {
        console.log('[ReportService] Generating Exam Report', { grade, examId });
        let query = `
            SELECT 
                e.id,
                e.title as exam_title,
                sub.subject_name as subject,
                e.exam_date,
                c.grade,
                c.section,
                COUNT(DISTINCT s.id) as total_students,
                COUNT(DISTINCT sea.student_id) as submitted_count,
                AVG(calculated_scores.score) as average_score,
                MAX(calculated_scores.score) as highest_score,
                MIN(calculated_scores.score) as lowest_score
            FROM exams e
            JOIN classes c ON e.class_id = c.id
            JOIN subjects sub ON e.subject_id = sub.id
            JOIN students s ON s.class_id = c.id
            LEFT JOIN student_exam_attempts sea ON s.id = sea.student_id AND e.id = sea.exam_id 
                AND (sea.status = 'submitted' OR sea.status = 'evaluated')
            LEFT JOIN (
                SELECT 
                    ans.attempt_id,
                    SUM(
                        CASE 
                            WHEN qb.question_type IN ('multiple_choice', 'true_false') AND ans.selected_option = qb.correct_answer THEN qb.marks
                            WHEN qb.question_type = 'short_answer' AND ans.text_answer IS NOT NULL AND LOWER(ans.text_answer) LIKE CONCAT('%', LOWER(qb.correct_answer), '%') THEN qb.marks
                            ELSE 0 
                        END
                    ) as score
                FROM student_exam_answers ans
                JOIN question_bank qb ON ans.question_id = qb.id
                GROUP BY ans.attempt_id
            ) calculated_scores ON sea.id = calculated_scores.attempt_id
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (grade) {
            conditions.push('c.grade = ?');
            params.push(grade);
        }

        if (examId) {
            conditions.push('e.id = ?');
            params.push(examId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Included extra fields in GROUP BY for strict mode compliance
        query += ` GROUP BY e.id, e.title, sub.subject_name, e.exam_date, c.grade, c.section ORDER BY e.exam_date DESC, c.grade, c.section`;

        const [rows]: any = await pool.query(query, params);
        return rows;
    }
}

export const reportService = new ReportService();
