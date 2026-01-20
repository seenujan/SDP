import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ExamData {
    title: string;
    subject: string;
    grade: string;
    section?: string;
    exam_date: string;
    duration: number;
    total_marks: number;
}

interface ExamQuestion {
    question_id: number;
    marks: number;
}

class ExamService {
    // Get all exams for a teacher
    async getExamsByTeacher(teacherId: number) {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                e.*,
                CONCAT(e.grade, ' ', IFNULL(e.section, '')) as class_name,
                COUNT(DISTINCT eq.question_id) as question_count
            FROM exams e
            LEFT JOIN exam_questions eq ON e.id = eq.exam_id
            WHERE e.teacher_id = ?
            GROUP BY e.id
            ORDER BY e.exam_date DESC`,
            [teacherId]
        );
        return rows;
    }

    // Get single exam with all questions
    async getExamById(examId: number, teacherId: number) {
        const [examRows] = await pool.execute<RowDataPacket[]>(
            `SELECT e.*, CONCAT(e.grade, ' ', IFNULL(e.section, '')) as class_name
            FROM exams e
            WHERE e.id = ? AND e.teacher_id = ?`,
            [examId, teacherId]
        );

        if (examRows.length === 0) {
            throw new Error('Exam not found');
        }

        const exam = examRows[0];

        // Get all questions for this exam
        const [questions] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                eq.id as exam_question_id,
                eq.marks as assigned_marks,
                eq.question_order,
                qb.id,
                qb.question_text,
                qb.question_type,
                qb.subject,
                qb.topic,
                qb.difficulty_level,
                qb.marks as default_marks,
                qb.options,
                qb.correct_answer
            FROM exam_questions eq
            JOIN question_bank qb ON eq.question_id = qb.id
            WHERE eq.exam_id = ?
            ORDER BY eq.question_order ASC`,
            [examId]
        );

        return {
            ...exam,
            questions
        };
    }

    // Create new exam
    async createExam(examData: ExamData, teacherId: number) {
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO exams 
            (title, subject, grade, section, teacher_id, exam_date, duration, total_marks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                examData.title,
                examData.subject,
                examData.grade,
                examData.section || null,
                teacherId,
                examData.exam_date,
                examData.duration,
                examData.total_marks
            ]
        );

        return { id: result.insertId, ...examData };
    }

    // Update exam
    async updateExam(examId: number, examData: Partial<ExamData>, teacherId: number) {
        // Verify ownership
        await this.verifyExamOwnership(examId, teacherId);

        const fields: string[] = [];
        const values: any[] = [];

        if (examData.title) {
            fields.push('title = ?');
            values.push(examData.title);
        }
        if (examData.subject) {
            fields.push('subject = ?');
            values.push(examData.subject);
        }
        if (examData.grade) {
            fields.push('grade = ?');
            values.push(examData.grade);
        }
        if (examData.section !== undefined) {
            fields.push('section = ?');
            values.push(examData.section || null);
        }
        if (examData.exam_date) {
            fields.push('exam_date = ?');
            values.push(examData.exam_date);
        }
        if (examData.duration) {
            fields.push('duration = ?');
            values.push(examData.duration);
        }
        if (examData.total_marks) {
            fields.push('total_marks = ?');
            values.push(examData.total_marks);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(examId);

        await pool.execute(
            `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return { id: examId, ...examData };
    }

    // Delete exam
    async deleteExam(examId: number, teacherId: number) {
        // Verify ownership
        await this.verifyExamOwnership(examId, teacherId);

        await pool.execute('DELETE FROM exams WHERE id = ?', [examId]);
        return { success: true };
    }

    // Add questions to exam
    async addQuestionsToExam(examId: number, questions: ExamQuestion[], teacherId: number) {
        // Verify ownership
        await this.verifyExamOwnership(examId, teacherId);

        // Delete existing questions first
        await pool.execute('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);

        // Add new questions
        if (questions.length > 0) {
            const values = questions.map((q, index) => [
                examId,
                q.question_id,
                q.marks,
                index + 1 // question_order
            ]);

            await pool.query(
                `INSERT INTO exam_questions (exam_id, question_id, marks, question_order) 
                VALUES ?`,
                [values]
            );

            // Update total marks
            const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
            await pool.execute(
                'UPDATE exams SET total_marks = ? WHERE id = ?',
                [totalMarks, examId]
            );
        }

        return { success: true, question_count: questions.length };
    }

    // Remove single question from exam
    async removeQuestionFromExam(examId: number, questionId: number, teacherId: number) {
        // Verify ownership
        await this.verifyExamOwnership(examId, teacherId);

        await pool.execute(
            'DELETE FROM exam_questions WHERE exam_id = ? AND question_id = ?',
            [examId, questionId]
        );

        // Recalculate total marks
        const [result] = await pool.execute<RowDataPacket[]>(
            'SELECT SUM(marks) as total FROM exam_questions WHERE exam_id = ?',
            [examId]
        );

        const totalMarks = result[0]?.total || 0;
        await pool.execute(
            'UPDATE exams SET total_marks = ? WHERE id = ?',
            [totalMarks, examId]
        );

        return { success: true };
    }

    // Publish exam
    async publishExam(examId: number, teacherId: number) {
        // Verify ownership
        await this.verifyExamOwnership(examId, teacherId);

        // Check if exam has questions
        const [questions] = await pool.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = ?',
            [examId]
        );

        if (questions[0].count === 0) {
            throw new Error('Cannot publish exam without questions');
        }

        await pool.execute(
            'UPDATE exams SET status = ? WHERE id = ?',
            ['published', examId]
        );

        return { success: true, status: 'published' };
    }

    // Helper: Verify exam ownership
    private async verifyExamOwnership(examId: number, teacherId: number) {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM exams WHERE id = ? AND teacher_id = ?',
            [examId, teacherId]
        );

        if (rows.length === 0) {
            throw new Error('Exam not found or access denied');
        }
    }
}

export default new ExamService();
