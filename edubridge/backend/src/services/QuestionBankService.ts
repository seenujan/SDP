import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Question {
    id?: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    subject_id: number;
    topic?: string;
    difficulty_level?: 'easy' | 'medium' | 'hard';
    marks: number;
    options?: string; // JSON string for MCQ options
    correct_answer?: string;
    teacher_id: number;
    created_at?: string;
}

export class QuestionBankService {
    // Get all questions by teacher
    async getQuestionsByTeacher(teacherId: number, filters?: any): Promise<any[]> {
        let query = `
            SELECT qb.*, s.subject_name as subject
            FROM question_bank qb
            JOIN subjects s ON qb.subject_id = s.id
            WHERE qb.teacher_id = ?
        `;
        const params: any[] = [teacherId];

        if (filters?.subject_id) {
            query += ' AND qb.subject_id = ?';
            params.push(filters.subject_id);
        } else if (filters?.subject) {
            // Legacy or name support if needed, but ideally use ID
            query += ' AND s.subject_name = ?';
            params.push(filters.subject);
        }

        if (filters?.topic) {
            query += ' AND qb.topic = ?';
            params.push(filters.topic);
        }

        if (filters?.difficulty_level) {
            query += ' AND qb.difficulty_level = ?';
            params.push(filters.difficulty_level);
        }

        if (filters?.question_type) {
            query += ' AND qb.question_type = ?';
            params.push(filters.question_type);
        }

        query += ' ORDER BY qb.created_at DESC';

        const [questions] = await pool.query<RowDataPacket[]>(query, params);

        // Parse options JSON for each question
        return questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
    }

    // Get question by ID
    async getQuestionById(questionId: number): Promise<any> {
        const [questions] = await pool.query<RowDataPacket[]>(
            `SELECT qb.*, s.subject_name as subject
             FROM question_bank qb
             JOIN subjects s ON qb.subject_id = s.id
             WHERE qb.id = ?`,
            [questionId]
        );

        if (questions.length === 0) return null;

        const question = questions[0];
        return {
            ...question,
            options: question.options ? JSON.parse(question.options) : null
        };
    }

    // Create new question
    async createQuestion(questionData: Question): Promise<any> {
        const optionsJson = questionData.options ? JSON.stringify(questionData.options) : null;

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO question_bank 
            (question_text, question_type, subject_id, topic, difficulty_level, marks, options, correct_answer, teacher_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                questionData.question_text,
                questionData.question_type,
                questionData.subject_id,
                questionData.topic || null,
                questionData.difficulty_level || 'medium',
                questionData.marks,
                optionsJson,
                questionData.correct_answer || null,
                questionData.teacher_id,
            ]
        );

        return this.getQuestionById(result.insertId);
    }

    // Update question
    async updateQuestion(questionId: number, questionData: Partial<Question>): Promise<any> {
        const updates: string[] = [];
        const values: any[] = [];

        if (questionData.question_text !== undefined) {
            updates.push('question_text = ?');
            values.push(questionData.question_text);
        }
        if (questionData.question_type !== undefined) {
            updates.push('question_type = ?');
            values.push(questionData.question_type);
        }
        if (questionData.subject_id !== undefined) {
            updates.push('subject_id = ?');
            values.push(questionData.subject_id);
        }
        if (questionData.topic !== undefined) {
            updates.push('topic = ?');
            values.push(questionData.topic);
        }
        if (questionData.difficulty_level !== undefined) {
            updates.push('difficulty_level = ?');
            values.push(questionData.difficulty_level);
        }
        if (questionData.marks !== undefined) {
            updates.push('marks = ?');
            values.push(questionData.marks);
        }
        if (questionData.options !== undefined) {
            updates.push('options = ?');
            values.push(JSON.stringify(questionData.options));
        }
        if (questionData.correct_answer !== undefined) {
            updates.push('correct_answer = ?');
            values.push(questionData.correct_answer);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(questionId);

        await pool.query(
            `UPDATE question_bank SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return this.getQuestionById(questionId);
    }

    // Delete question
    async deleteQuestion(questionId: number): Promise<void> {
        await pool.query('DELETE FROM question_bank WHERE id = ?', [questionId]);
    }

    // Search questions
    async searchQuestions(teacherId: number, searchTerm: string): Promise<any[]> {
        const [questions] = await pool.query<RowDataPacket[]>(
            `SELECT qb.*, s.subject_name as subject
            FROM question_bank qb
            JOIN subjects s ON qb.subject_id = s.id
            WHERE qb.teacher_id = ? AND (
                qb.question_text LIKE ? OR 
                s.subject_name LIKE ? OR 
                qb.topic LIKE ?
            )
            ORDER BY qb.created_at DESC`,
            [teacherId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );

        return questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
    }

    // Get questions by subject
    async getQuestionsBySubject(teacherId: number, subject: string): Promise<any[]> {
        // Assume 'subject' parameter might be ID or Name.
        // Ideally we should use ID. But for backward compatibility let's handle name if string provided.
        // Actually, let's assume it's subject NAME for now as frontend filtering often uses names unless we change it.
        // Wait, current frontend uses names.
        // But we want to use ID.

        // Use ID if number, join if string
        // Actually simplest is join and filter by subject_name = ?

        const [questions] = await pool.query<RowDataPacket[]>(
            `SELECT qb.*, s.subject_name as subject
             FROM question_bank qb
             JOIN subjects s ON qb.subject_id = s.id
             WHERE qb.teacher_id = ? AND s.subject_name = ? 
             ORDER BY qb.created_at DESC`,
            [teacherId, subject]
        );

        return questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
    }
}

export const questionBankService = new QuestionBankService();
