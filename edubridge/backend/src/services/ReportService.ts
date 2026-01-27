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
    // Get Certificate Report
    async getCertificateReport(typeId?: number, startDate?: string, endDate?: string) {
        console.log('[ReportService] Generating Certificate Report', { typeId, startDate, endDate });
        let query = `
            SELECT 
                ci.certificate_number,
                ct.name as certificate_type,
                s.full_name as student_name,
                c.grade,
                c.section,
                ci.issue_date,
                u.email as issued_by
            FROM certificate_issue ci
            JOIN certificate_types ct ON ci.certificate_type_id = ct.id
            JOIN students s ON ci.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            JOIN users u ON ci.issued_by = u.id
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (typeId) {
            conditions.push('ci.certificate_type_id = ?');
            params.push(typeId);
        }

        if (startDate && endDate) {
            conditions.push('ci.issue_date BETWEEN ? AND ?');
            params.push(startDate, endDate);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY ci.issue_date DESC';

        const [rows]: any = await pool.query(query, params);
        return rows;
    }

    // Get Scholarship Eligible Students
    async getScholarshipEligibleStudents(filters: {
        incomeLimit?: number;
        maxRank?: number;
        grade?: string;
        search?: string;
    }) {
        console.log('[ReportService] Fetching eligible students with rank', filters);

        let query = `
            WITH StudentMarks AS (
                SELECT 
                    tm.student_id,
                    AVG(tm.marks) as avg_mark -- Calculate average mark directly
                FROM term_marks tm
                GROUP BY tm.student_id
            ),
            StudentRanks AS (
                SELECT 
                    s.id as student_id,
                    s.class_id,
                    RANK() OVER (PARTITION BY s.class_id ORDER BY COALESCE(sm.avg_mark, 0) DESC) as class_rank
                FROM students s
                LEFT JOIN StudentMarks sm ON s.id = sm.student_id
            )
            SELECT 
                s.id,
                s.full_name as name,
                c.grade,
                c.section,
                p.annual_income as parentIncome,
                sr.class_rank,
                CASE 
                    WHEN exists_sch.id IS NOT NULL THEN 'Awarded'
                    ELSE 'Eligible'
                END as status
            FROM students s
            JOIN classes c ON s.class_id = c.id
            JOIN StudentRanks sr ON s.id = sr.student_id
            LEFT JOIN parents p ON s.parent_id = p.user_id 
            LEFT JOIN scholarships exists_sch ON s.id = exists_sch.student_id
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (filters.grade) {
            conditions.push('c.grade = ?');
            params.push(filters.grade);
        }

        if (filters.incomeLimit) {
            conditions.push('p.annual_income <= ?');
            params.push(filters.incomeLimit);
        }

        if (filters.maxRank) {
            conditions.push('sr.class_rank <= ?');
            params.push(filters.maxRank);
        }

        if (filters.search) {
            conditions.push('s.full_name LIKE ?');
            params.push(`%${filters.search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY sr.class_rank ASC, p.annual_income ASC LIMIT 100';

        const [rows]: any = await pool.query(query, params);

        return rows.map((row: any) => ({
            ...row,
            class_rank: Number(row.class_rank),
            status: row.status
        }));
    }

    // Get Scholarship Report
    async getScholarshipReport(startDate?: string, endDate?: string) {
        console.log('[ReportService] Generating Scholarship Report', { startDate, endDate });
        let query = `
            SELECT 
                sch.title,
                sch.amount,
                sch.awarded_date,
                s.full_name as student_name,
                c.grade,
                c.section,
                sch.description
            FROM scholarships sch
            JOIN students s ON sch.student_id = s.id
            JOIN classes c ON s.class_id = c.id
        `;

        const params: any[] = [];
        if (startDate && endDate) {
            query += ' WHERE sch.awarded_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY sch.awarded_date DESC';

        const [rows]: any = await pool.query(query, params);
        return rows;
    }

    // Get User Report
    async getUserReport(role?: string, status?: string) {
        console.log('[ReportService] Generating User Report', { role, status });
        let query = `
            SELECT 
                u.id,
                COALESCE(s.full_name, t.full_name, p.full_name, u.email) as name,
                u.email,
                u.role,
                CASE WHEN u.active = 1 THEN 'Active' ELSE 'Inactive' END as status,
                DATE_FORMAT(u.created_at, '%Y-%m-%d') as joined_date,
                -- Additional details depending on role
                CASE 
                    WHEN u.role = 'student' THEN CONCAT(c.grade, '-', c.section)
                    WHEN u.role = 'teacher' THEN sub.subject_name
                    ELSE 'N/A'
                END as 'class_or_subject'
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN teachers t ON u.id = t.user_id
            LEFT JOIN subjects sub ON t.subject_id = sub.id
            LEFT JOIN parents p ON u.id = p.user_id
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (role) {
            conditions.push('u.role = ?');
            params.push(role);
        }

        if (status) {
            const isActive = status === 'active' ? 1 : 0;
            conditions.push('u.active = ?');
            params.push(isActive);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY u.created_at DESC';

        const [rows]: any = await pool.query(query, params);
        return rows;
    }

    // Get PTM Feedback Report
    async getPTMFeedbackReport(startDate?: string, endDate?: string) {
        console.log('[ReportService] Generating PTM Feedback Report');
        let query = `
            SELECT 
                pf.feedback_from,
                pf.feedback,
                DATE_FORMAT(pf.created_at, '%Y-%m-%d %H:%i') as submitted_at,
                pm.meeting_date,
                s.full_name as student_name,
                c.grade,
                c.section,
                t.full_name as teacher_name,
                p.full_name as parent_name
            FROM ptm_feedback pf
            JOIN ptm_meetings pm ON pf.ptm_meeting_id = pm.id
            JOIN students s ON pm.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            JOIN teachers t ON pm.teacher_id = t.user_id
            JOIN parents p ON pm.parent_id = p.user_id
        `;

        const params: any[] = [];
        if (startDate && endDate) {
            query += ' WHERE pm.meeting_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY pf.created_at DESC';

        const [rows]: any = await pool.query(query, params);
        return rows;
    }
}

export const reportService = new ReportService();
