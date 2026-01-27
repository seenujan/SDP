import { pool } from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ExamData {
    title: string;
    subject_id: number;
    class_id: number;
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
                CONCAT(c.grade, ' ', c.section) as class_name,
                s.subject_name as subject,
                COUNT(DISTINCT eq.question_id) as question_count
            FROM exams e
            JOIN classes c ON e.class_id = c.id
            JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN exam_questions eq ON e.id = eq.exam_id
            WHERE e.teacher_id = ?
            GROUP BY e.id
            ORDER BY e.exam_date DESC`,
            [teacherId]
        );
        return rows;
    }

    // Get exams for a specific class (with student status)
    async getExamsByClass(classId: number, studentId?: number) {
        let query = `SELECT 
                e.*, 
                t.full_name as teacher_name,
                s.subject_name as subject,
                COUNT(DISTINCT eq.question_id) as question_count
            FROM exams e
            JOIN teachers t ON e.teacher_id = t.user_id
            JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN exam_questions eq ON e.id = eq.exam_id
            WHERE e.class_id = ? 
            AND e.status = 'published'
            GROUP BY e.id, t.full_name, s.subject_name`;

        const params: any[] = [classId];

        if (studentId) {
            query = `SELECT 
                e.*, 
                t.full_name as teacher_name,
                s.subject_name as subject,
                COUNT(DISTINCT eq.question_id) as question_count,
                sea.status as attempt_status,
                sea.id as attempt_id,
                (
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN qb.question_type IN ('multiple_choice', 'true_false') AND ans.selected_option COLLATE utf8mb4_unicode_ci = qb.correct_answer COLLATE utf8mb4_unicode_ci THEN qb.marks
                            WHEN qb.question_type = 'short_answer' AND ans.text_answer IS NOT NULL AND LOWER(ans.text_answer) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', LOWER(qb.correct_answer) COLLATE utf8mb4_unicode_ci, '%') THEN qb.marks
                            ELSE 0 
                        END
                    ), 0)
                    FROM student_exam_answers ans
                    JOIN question_bank qb ON ans.question_id = qb.id
                    WHERE ans.attempt_id = sea.id
                ) as total_score
            FROM exams e
            JOIN teachers t ON e.teacher_id = t.user_id
            JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN exam_questions eq ON e.id = eq.exam_id
            LEFT JOIN student_exam_attempts sea ON e.id = sea.exam_id AND sea.student_id = ?
            WHERE e.class_id = ? 
            AND e.status = 'published'
            GROUP BY e.id, t.full_name, s.subject_name, sea.status, sea.id`;
            params.unshift(studentId); // Add studentId at the start
        }

        query += ` ORDER BY e.exam_date DESC`;

        const [rows] = await pool.execute<RowDataPacket[]>(query, params);
        return rows;
    }

    // Get single exam with all questions
    async getExamById(examId: number, teacherId: number) {
        const [examRows] = await pool.execute<RowDataPacket[]>(
            `SELECT e.*, 
                CONCAT(c.grade, ' ', c.section) as class_name,
                s.subject_name as subject
            FROM exams e
            JOIN classes c ON e.class_id = c.id
            JOIN subjects s ON e.subject_id = s.id
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
            (title, subject_id, class_id, teacher_id, exam_date, duration, total_marks)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                examData.title,
                examData.subject_id,
                examData.class_id,
                teacherId,
                examData.exam_date,
                examData.duration,
                examData.total_marks || 0
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
        if (examData.subject_id) {
            fields.push('subject_id = ?');
            values.push(examData.subject_id);
        }
        if (examData.class_id) {
            fields.push('class_id = ?');
            values.push(examData.class_id);
        }
        if (examData.exam_date) {
            fields.push('exam_date = ?');
            values.push(examData.exam_date);
        }
        if (examData.duration) {
            fields.push('duration = ?');
            values.push(examData.duration);
        }
        if (examData.total_marks !== undefined) {
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
        } else {
            // Use 0 if no questions, or keep existing?
            // If we are replacing all questions, and questions is empty, total_marks -> 0?
            // But if it's a manual exam, we might NOT want to override it.
            // However, addQuestionsToExam implies it IS an online exam with questions.
            // So updating total_marks here is correct.
            await pool.execute(
                'UPDATE exams SET total_marks = 0 WHERE id = ?',
                [examId]
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

        // Check if exam has questions OR is manual (has total_marks > 0)
        // Check questions
        const [questions] = await pool.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = ?',
            [examId]
        );

        // Check total_marks
        const [examRes] = await pool.execute<RowDataPacket[]>(
            'SELECT total_marks FROM exams WHERE id = ?',
            [examId]
        );
        const totalMarks = examRes[0]?.total_marks || 0;

        // Allow publish if it has questions OR has a total_marks set (manual exam)
        if (questions[0].count === 0 && totalMarks === 0) {
            // Strict check? Or lenient?
            // If it's a manual exam, user should have set total_marks.
            // If they haven't set questions AND total_marks is 0, it's invalid.
            throw new Error('Cannot publish exam without questions or total marks');
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
    // Get exam for student (excludes correct answers)
    async getStudentExamById(examId: number) {
        // Get exam details
        const [examRows] = await pool.execute<RowDataPacket[]>(
            `SELECT e.*, s.subject_name as subject 
             FROM exams e
             JOIN subjects s ON e.subject_id = s.id
             WHERE e.id = ?`,
            [examId]
        );

        if (examRows.length === 0) {
            throw new Error('Exam not found');
        }

        const exam = examRows[0];

        // Get questions without correct answers
        const [questions] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                eq.id as exam_question_id,
                eq.marks,
                eq.question_order,
                qb.id as question_id,
                qb.question_text,
                qb.question_type,
                qb.options
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

    // Start or resume exam attempt
    async initializeExamAttempt(studentId: number, examId: number) {
        // Check if attempt exists
        const [attempts] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM student_exam_attempts WHERE student_id = ? AND exam_id = ?',
            [studentId, examId]
        );

        let attemptId;
        let attempt;

        if (attempts.length === 0) {
            // Create new attempt
            const [result] = await pool.execute<ResultSetHeader>(
                'INSERT INTO student_exam_attempts (student_id, exam_id, start_time) VALUES (?, ?, NOW())',
                [studentId, examId]
            );
            attemptId = result.insertId;
            attempt = { id: attemptId, status: 'in_progress', start_time: new Date() };
        } else {
            attempt = attempts[0];
            attemptId = attempt.id;
        }

        // Get saved answers
        const [answers] = await pool.execute<RowDataPacket[]>(
            'SELECT question_id, selected_option, text_answer FROM student_exam_answers WHERE attempt_id = ?',
            [attemptId]
        );

        // Get exam details and questions
        const examData = await this.getStudentExamById(examId);

        return {
            attempt,
            exam: examData,
            answers
        };
    }

    // Save answer
    async saveAnswer(attemptId: number, questionId: number, answer: { selected_option?: string, text_answer?: string }) {
        // Check if exists
        const [existing] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM student_exam_answers WHERE attempt_id = ? AND question_id = ?',
            [attemptId, questionId]
        );

        if (existing.length > 0) {
            await pool.execute(
                'UPDATE student_exam_answers SET selected_option = ?, text_answer = ? WHERE id = ?',
                [answer.selected_option || null, answer.text_answer || null, existing[0].id]
            );
        } else {
            await pool.execute(
                'INSERT INTO student_exam_answers (attempt_id, question_id, selected_option, text_answer) VALUES (?, ?, ?, ?)',
                [attemptId, questionId, answer.selected_option || null, answer.text_answer || null]
            );
        }
        return { success: true };
    }

    // Submit and auto-grade
    async submitExam(attemptId: number) {
        // ... (existing code remains the same)
        // Auto-generated replacement for context
        // Get attempt to verify
        const [attempts] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM student_exam_attempts WHERE id = ?',
            [attemptId]
        );
        if (attempts.length === 0) throw new Error('Attempt not found');

        const attempt = attempts[0];
        if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
            return { success: true, message: 'Already submitted', score: attempt.total_score };
        }

        // Get all answers
        const [answers] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM student_exam_answers WHERE attempt_id = ?',
            [attemptId]
        );

        // Get questions for grading
        const [questions] = await pool.execute<RowDataPacket[]>(
            `SELECT qb.id, qb.question_type, qb.correct_answer, qb.marks, qb.options 
             FROM exam_questions eq
             JOIN question_bank qb ON eq.question_id = qb.id
             WHERE eq.exam_id = ?`,
            [attempt.exam_id]
        );

        let totalScore = 0;
        const questionMap = new Map(questions.map((q: any) => [q.id, q]));

        // Grade answers
        for (const ans of answers) {
            const question = questionMap.get(ans.question_id);
            if (!question) continue;

            let isCorrect = false;
            let marks = 0;

            if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
                if (ans.selected_option === question.correct_answer) {
                    isCorrect = true;
                    marks = question.marks;
                }
            } else if (question.question_type === 'short_answer') {
                // Keyword matching
                if (question.correct_answer) {
                    const keywords = question.correct_answer.split(',').map((k: string) => k.trim().toLowerCase());
                    const studentText = (ans.text_answer || '').toLowerCase();

                    if (keywords.some((k: string) => studentText.includes(k))) {
                        isCorrect = true;
                        marks = question.marks;
                    }
                }
            }

            if (isCorrect) {
                totalScore += marks;
            }

            // Logic to update derived columns removed for 3NF
            // student_exam_answers no longer stores is_correct or marks_awarded
        }

        // Update attempt
        await pool.execute(
            'UPDATE student_exam_attempts SET status = ?, end_time = NOW() WHERE id = ?',
            ['submitted', attemptId]
        );

        // online_exam_marks and total_score updates REMOVED for Strict 3NF

        return { success: true, score: totalScore };
    }

    // Get all submissions for an exam (Teacher View)
    async getExamSubmissions(examId: number) {
        const [submissions] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                sea.id as attempt_id,
                sea.status,
                sea.start_time,
                sea.end_time,
                s.full_name as student_name,
                s.roll_number,
                c.grade,
                c.section,
                (
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN qb.question_type IN ('multiple_choice', 'true_false') AND ans.selected_option COLLATE utf8mb4_unicode_ci = qb.correct_answer COLLATE utf8mb4_unicode_ci THEN qb.marks
                            WHEN qb.question_type = 'short_answer' AND ans.text_answer IS NOT NULL AND LOWER(ans.text_answer) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', LOWER(qb.correct_answer) COLLATE utf8mb4_unicode_ci, '%') THEN qb.marks
                            ELSE 0 
                        END
                    ), 0)
                    FROM student_exam_answers ans
                    JOIN question_bank qb ON ans.question_id = qb.id
                    WHERE ans.attempt_id = sea.id
                ) as total_score
            FROM student_exam_attempts sea
            JOIN students s ON sea.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE sea.exam_id = ?
            ORDER BY sea.end_time DESC`,
            [examId]
        );
        return submissions;
    }

    // Get detailed student attempt (Teacher View)
    async getStudentAttemptDetails(attemptId: number) {
        // Get attempt details
        const [attemptRows] = await pool.query<RowDataPacket[]>('SELECT * FROM student_exam_attempts WHERE id = ?', [attemptId]);
        if (attemptRows.length === 0) throw new Error('Attempt not found');
        const attempt = attemptRows[0];

        // Get student info
        const [studentRows] = await pool.query<RowDataPacket[]>('SELECT full_name, roll_number FROM students WHERE id = ?', [attempt.student_id]);
        const student = studentRows[0];

        // Get answers with correctness and question details
        const [answers] = await pool.query<RowDataPacket[]>(
            `SELECT sea.*, qb.question_text, qb.question_type, qb.options, qb.correct_answer as model_answer, qb.marks as max_marks
             FROM student_exam_answers sea
             JOIN question_bank qb ON sea.question_id = qb.id
             WHERE sea.attempt_id = ?`,
            [attemptId]
        );

        // Calculate correctness and marks on the fly (3NF)
        const detailedAnswers = answers.map((ans: any) => {
            let isCorrect = false;
            let marksAwarded = 0;

            if (ans.question_type === 'multiple_choice' || ans.question_type === 'true_false') {
                if (ans.selected_option === ans.model_answer) {
                    isCorrect = true;
                    marksAwarded = ans.max_marks;
                }
            } else if (ans.question_type === 'short_answer' && ans.model_answer) {
                const keywords = ans.model_answer.split(',').map((k: string) => k.trim().toLowerCase());
                const studentText = (ans.text_answer || '').toLowerCase();

                if (keywords.some((k: string) => studentText.includes(k))) {
                    isCorrect = true;
                    marksAwarded = ans.max_marks;
                }
            }

            return {
                ...ans,
                is_correct: isCorrect,
                marks_awarded: marksAwarded
            };
        });

        const totalScore = detailedAnswers.reduce((sum: number, ans: any) => sum + ans.marks_awarded, 0);

        return {
            attempt: {
                ...attempt,
                total_score: totalScore
            },
            student,
            answers: detailedAnswers
        };
    }

    // Manual Marks Upload
    async uploadManualMarks(examId: number, marksData: { studentId: number; marks: number }[], teacherId: number) {
        // Verify ownership
        await this.verifyExamOwnership(examId, teacherId);

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const item of marksData) {
                // Check if attempt exists
                const [attempts] = await connection.execute<RowDataPacket[]>(
                    'SELECT id FROM student_exam_attempts WHERE student_id = ? AND exam_id = ?',
                    [item.studentId, examId]
                );

                if (attempts.length > 0) {
                    // Update existing
                    await connection.execute(
                        'UPDATE student_exam_attempts SET score = ?, status = ?, end_time = NOW() WHERE id = ?',
                        [item.marks, 'evaluated', attempts[0].id]
                    );
                } else {
                    // Create new attempt
                    await connection.execute(
                        'INSERT INTO student_exam_attempts (student_id, exam_id, start_time, end_time, status, score) VALUES (?, ?, NOW(), NOW(), ?, ?)',
                        [item.studentId, examId, 'evaluated', item.marks]
                    );
                }
            }

            await connection.commit();
            return { success: true, message: 'Marks uploaded successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get marks for an exam (Simple list for manual entry)
    async getExamMarks(examId: number) {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                s.id as student_id,
                s.full_name as student_name,
                s.roll_number,
                sea.score as marks,
                sea.status
             FROM students s
             JOIN exams e ON e.class_id = s.class_id
             LEFT JOIN student_exam_attempts sea ON s.id = sea.student_id AND sea.exam_id = e.id
             WHERE e.id = ?
             ORDER BY s.roll_number`,
            [examId]
        );
        return rows;
    }
}

export default new ExamService();
