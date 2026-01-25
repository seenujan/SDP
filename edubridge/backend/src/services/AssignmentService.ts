import { pool } from '../config/database';

export class AssignmentService {
    // Create assignment
    async createAssignment(data: {
        title: string;
        description: string;
        dueDate: string;
        subject: string;
        grade: string;
        section?: string;
        assignmentFileUrl: string;
        createdBy: number;
    }) {
        const [result]: any = await pool.query(
            `INSERT INTO assignments (title, description, due_date, subject, grade, section, assignment_file_url, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.title, data.description, data.dueDate, data.subject, data.grade, data.section || null, data.assignmentFileUrl, data.createdBy]
        );

        return { id: result.insertId, ...data };
    }

    // Get all assignments
    async getAllAssignments() {
        const [rows] = await pool.query(
            `SELECT 
        a.*,
        t.full_name as teacher_name,
        COUNT(DISTINCT sub.id) as submission_count
      FROM assignments a
      JOIN teachers t ON a.created_by = t.user_id
      LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id
      GROUP BY a.id
      ORDER BY a.created_at DESC`
        );

        return rows;
    }

    // Get assignments for a specific class (Grade + Section)
    async getAssignmentsByClass(grade: string, section: string, studentId: number) {
        const [rows] = await pool.query(
            `SELECT 
                a.*, 
                t.full_name as teacher_name,
                s.status as submission_status,
                s.submitted_at as submission_date,
                s.submission_file_url,
                s.id as submission_id,
                am.marks as obtained_marks,
                am.feedback
            FROM assignments a
            JOIN teachers t ON a.created_by = t.user_id
            LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
            LEFT JOIN assignment_marks am ON s.id = am.assignment_submission_id
            WHERE a.grade = ? AND (a.section = ? OR a.section IS NULL)
            ORDER BY a.due_date DESC`,
            [studentId, grade, section]
        );

        return rows;
    }

    // Get assignments created by a teacher
    async getAssignmentsByTeacher(teacherId: number) {
        const [rows] = await pool.query(
            `SELECT a.*, COUNT(DISTINCT sub.id) as submission_count
       FROM assignments a
       LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id
       WHERE a.created_by = ?
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
            [teacherId]
        );

        return rows;
    }

    // Submit assignment
    async submitAssignment(data: {
        assignmentId: number;
        studentId: number;
        submissionFileUrl: string;
    }) {
        // Get assignment due date
        const [assignment]: any = await pool.query(
            'SELECT due_date FROM assignments WHERE id = ?',
            [data.assignmentId]
        );

        if (!assignment[0]) {
            throw new Error('Assignment not found');
        }

        const dueDate = new Date(assignment[0].due_date);
        const now = new Date();
        const status = now <= dueDate ? 'on_time' : 'late';

        const [result]: any = await pool.query(
            `INSERT INTO assignment_submissions (assignment_id, student_id, submission_file_url, status)
       VALUES (?, ?, ?, ?)`,
            [data.assignmentId, data.studentId, data.submissionFileUrl, status]
        );

        return { id: result.insertId, status };
    }

    // Get submissions for an assignment
    async getSubmissionsForAssignment(assignmentId: number) {
        console.log('Fetching submissions for assignment:', assignmentId);
        const [rows] = await pool.query(
            `SELECT 
        sub.*,
        s.full_name as student_name,
        c.grade,
        c.section,
        am.marks,
        am.feedback
      FROM assignment_submissions sub
      LEFT JOIN students s ON sub.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN assignment_marks am ON sub.id = am.assignment_submission_id
      WHERE sub.assignment_id = ?
      ORDER BY sub.submitted_at DESC`,
            [assignmentId]
        );
        console.log('Found submissions:', rows);
        return rows;
    }

    // Get student's assignment submissions
    async getStudentSubmissions(studentId: number) {
        const [rows] = await pool.query(
            `SELECT 
        sub.*,
        a.title,
        a.description,
        a.due_date,
        a.subject,
        am.marks,
        am.feedback
      FROM assignment_submissions sub
      JOIN assignments a ON sub.assignment_id = a.id
      LEFT JOIN assignment_marks am ON sub.id = am.assignment_submission_id
      WHERE sub.student_id = ?
      ORDER BY sub.submitted_at DESC`,
            [studentId]
        );

        return rows;
    }

    // Mark assignment
    async markAssignment(submissionId: number, marks: number, feedback: string) {
        // Check if mark exists
        const [existingMark]: any = await pool.query(
            'SELECT id FROM assignment_marks WHERE assignment_submission_id = ?',
            [submissionId]
        );

        if (existingMark.length > 0) {
            await pool.query(
                'UPDATE assignment_marks SET marks = ?, feedback = ? WHERE id = ?',
                [marks, feedback, existingMark[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO assignment_marks (assignment_submission_id, marks, feedback) VALUES (?, ?, ?)',
                [submissionId, marks, feedback]
            );
        }

        return { submissionId, marks, feedback };
    }

    // Bulk upload assignment marks (creates submissions if they don't exist)
    async bulkUploadAssignmentMarks(assignmentId: number, marksData: Array<{
        student_id: number;
        marks: number;
        feedback?: string;
    }>) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const data of marksData) {
                // Check if submission exists
                const [existingSubmission]: any = await connection.query(
                    'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
                    [assignmentId, data.student_id]
                );

                let submissionId;
                if (existingSubmission.length > 0) {
                    submissionId = existingSubmission[0].id;
                } else {
                    // Create a submission entry with status 'graded' (no file uploaded)
                    const [insertResult]: any = await connection.query(
                        `INSERT INTO assignment_submissions (assignment_id, student_id, status, submission_file_url)
                         VALUES (?, ?, 'graded', '')`,
                        [assignmentId, data.student_id]
                    );
                    submissionId = insertResult.insertId;
                }

                // Check if mark exists
                const [existingMark]: any = await connection.query(
                    'SELECT id FROM assignment_marks WHERE assignment_submission_id = ?',
                    [submissionId]
                );

                if (existingMark.length > 0) {
                    await connection.query(
                        'UPDATE assignment_marks SET marks = ?, feedback = ? WHERE id = ?',
                        [data.marks, data.feedback || null, existingMark[0].id]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO assignment_marks (assignment_submission_id, marks, feedback)
                         VALUES (?, ?, ?)`,
                        [submissionId, data.marks, data.feedback || null]
                    );
                }
            }

            await connection.commit();
            return { success: true, message: 'Assignment marks uploaded successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export const assignmentService = new AssignmentService();
