import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Question {
    id?: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    subject: string;
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
        let query = `SELECT * FROM question_bank WHERE teacher_id = ?`;
        const params: any[] = [teacherId];

        if (filters?.subject) {
            query += ' AND subject = ?';
            params.push(filters.subject);
        }

        if (filters?.topic) {
            query += ' AND topic = ?';
            params.push(filters.topic);
        }

        if (filters?.difficulty_level) {
            query += ' AND difficulty_level = ?';
            params.push(filters.difficulty_level);
        }

        if (filters?.question_type) {
            query += ' AND question_type = ?';
            params.push(filters.question_type);
        }

        query += ' ORDER BY created_at DESC';

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
            'SELECT * FROM question_bank WHERE id = ?',
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
            (question_text, question_type, subject, topic, difficulty_level, marks, options, correct_answer, teacher_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                questionData.question_text,
                questionData.question_type,
                questionData.subject,
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
        if (questionData.subject !== undefined) {
            updates.push('subject = ?');
            values.push(questionData.subject);
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
            `SELECT * FROM question_bank 
            WHERE teacher_id = ? AND (
                question_text LIKE ? OR 
                subject LIKE ? OR 
                topic LIKE ?
            )
            ORDER BY created_at DESC`,
            [teacherId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );

        return questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
    }

    // Get questions by subject
    async getQuestionsBySubject(teacherId: number, subject: string): Promise<any[]> {
        const [questions] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM question_bank WHERE teacher_id = ? AND subject = ? ORDER BY created_at DESC',
            [teacherId, subject]
        );

        return questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
    }
}

export const questionBankService = new QuestionBankService();
