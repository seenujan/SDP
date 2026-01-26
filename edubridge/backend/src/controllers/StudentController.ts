import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { assignmentService } from '../services/AssignmentService';
import examService from '../services/ExamService';
import { attendanceService } from '../services/AttendanceService';
import { TodoService } from '../services/TodoService';
import { studentPortfolioService } from '../services/StudentPortfolioService';
import { announcementService, eventService } from '../services/AnnouncementService';
import { pool } from '../config/database';

export class StudentController {
    // ... existing methods ...
    // GET /api/student/dashboard
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            // Get student ID from user ID
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            if (!student || student.length === 0) {
                return res.status(404).json({ error: 'Student profile not found' });
            }

            const data = await dashboardService.getStudentDashboard(student[0].id);
            res.json(data);
        } catch (error: any) {
            console.error('[getDashboard] Error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/assignments
    async getAssignments(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                `SELECT s.id, s.class_id 
                 FROM students s 
                 WHERE s.user_id = ?`,
                [req.user!.id]
            );

            if (!student || student.length === 0) {
                return res.status(404).json({ error: 'Student profile not found' });
            }

            const assignments = await assignmentService.getAssignmentsByClass(
                student[0].class_id,
                student[0].id
            );
            res.json(assignments);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/exams
    async getExams(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                `SELECT s.id, s.class_id 
                 FROM students s 
                 WHERE s.user_id = ?`,
                [req.user!.id]
            );

            if (!student || student.length === 0) {
                return res.status(404).json({ error: 'Student profile not found' });
            }

            const exams = await examService.getExamsByClass(
                student[0].class_id,
                student[0].id
            );
            res.json(exams);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/exams/:id
    async getExam(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            // Initialize or resume attempt
            const examData = await examService.initializeExamAttempt(
                student[0].id,
                parseInt(req.params.id)
            );
            res.json(examData);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/student/exams/:id/answer
    async saveAnswer(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            // Get attempt ID
            const [attempts]: any = await pool.query(
                'SELECT id FROM student_exam_attempts WHERE student_id = ? AND exam_id = ?',
                [student[0].id, parseInt(req.params.id)]
            );

            if (attempts.length === 0) {
                return res.status(404).json({ error: 'Exam attempt not found' });
            }

            const { question_id, selected_option, text_answer } = req.body;

            await examService.saveAnswer(attempts[0].id, question_id, {
                selected_option,
                text_answer
            });

            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/student/exams/:id/submit-attempt
    async submitExam(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                `SELECT id FROM students WHERE user_id = ?`,
                [req.user!.id]
            );

            // Get attempt ID
            const [attempts]: any = await pool.query(
                'SELECT id FROM student_exam_attempts WHERE student_id = ? AND exam_id = ?',
                [student[0].id, parseInt(req.params.id)]
            );

            if (attempts.length === 0) {
                return res.status(404).json({ error: 'Exam attempt not found' });
            }

            const result = await examService.submitExam(attempts[0].id);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/exams/:id/result
    async viewExamResult(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                `SELECT id FROM students WHERE user_id = ?`,
                [req.user!.id]
            );

            // Get attempt ID
            const [attempts]: any = await pool.query(
                'SELECT id FROM student_exam_attempts WHERE student_id = ? AND exam_id = ? AND (status = "submitted" OR status = "evaluated")',
                [student[0].id, parseInt(req.params.id)]
            );

            if (attempts.length === 0) {
                return res.status(404).json({ error: 'Exam result not found or not yet active' });
            }

            // Reuse backend service logic or create new valid service method?
            // Reusing initializeExamAttempt might give too much "active" data.
            // Let's rely on a new service method or direct query for now, but cleaner to use service.
            // Let's actually Fetch the full attempt details including answers and correctness.

            const attemptId = attempts[0].id;

            // Get attempt details
            const [attemptRows]: any = await pool.query('SELECT * FROM student_exam_attempts WHERE id = ?', [attemptId]);
            const attempt = attemptRows[0];

            // Get answers with correctness
            const [answers]: any = await pool.query(
                `SELECT sea.*, qb.question_text, qb.question_type, qb.options, qb.correct_answer as model_answer, qb.marks as max_marks
                 FROM student_exam_answers sea
                 JOIN question_bank qb ON sea.question_id = qb.id
                 WHERE sea.attempt_id = ?`,
                [attemptId]
            );

            // Get Exam Details
            const [examRows]: any = await pool.query('SELECT * FROM exams WHERE id = ?', [parseInt(req.params.id)]);


            res.json({
                exam: examRows[0],
                attempt: attempt,
                answers: answers
            });

        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/student/assignments/:id/submit
    async submitAssignment(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Submission file is required' });
            }

            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const result = await assignmentService.submitAssignment({
                assignmentId: parseInt(req.params.id),
                studentId: student[0].id,
                submissionFileUrl: `uploads/submissions/${req.file.filename}`,
            });

            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/student/submissions
    async getMySubmissions(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const submissions = await assignmentService.getStudentSubmissions(student[0].id);
            res.json(submissions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/attendance
    async getAttendance(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const attendance = await attendanceService.getStudentAttendance(student[0].id);
            const stats = await attendanceService.getAttendanceStats(student[0].id);

            res.json({ attendance, stats });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/todos
    async getTodos(req: AuthRequest, res: Response) {
        try {
            console.log('[getTodos] User ID:', req.user!.id);

            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            console.log('[getTodos] Student query result:', student);

            if (!student || student.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }

            console.log('[getTodos] Student ID:', student[0].id);

            const todos = await TodoService.getStudentTodos(student[0].id);
            res.json(todos);
        } catch (error: any) {
            console.error('[getTodos] Error:', error);
            res.status(500).json({ error: error.message });
        }
    }


    // POST /api/student/todos
    async createTodo(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const { title, description, dueDate, priority, status, category } = req.body;

            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }

            const todoId = await TodoService.createTodo({
                studentId: student[0].id,
                title,
                description,
                dueDate,
                priority,
                status,
                category
            });

            res.status(201).json({ id: todoId, message: 'Todo created successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/student/todos/:id
    async updateTodo(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const todoId = parseInt(req.params.id);
            const { title, description, dueDate, priority, status, category } = req.body;

            const updated = await TodoService.updateTodo(todoId, student[0].id, {
                title,
                description,
                dueDate,
                priority,
                status,
                category
            });

            if (!updated) {
                return res.status(404).json({ error: 'Todo not found' });
            }

            res.json({ message: 'Todo updated successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/student/todos/:id
    async deleteTodo(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const todoId = parseInt(req.params.id);

            const deleted = await TodoService.deleteTodo(todoId, student[0].id);

            if (!deleted) {
                return res.status(404).json({ error: 'Todo not found' });
            }

            res.json({ message: 'Todo deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // PATCH /api/student/todos/:id/toggle
    async toggleTodoStatus(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const todoId = parseInt(req.params.id);

            await TodoService.toggleTodoStatus(todoId, student[0].id);

            res.json({ message: 'Todo status toggled successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
    // GET /api/student/portfolio
    async getPortfolio(req: AuthRequest, res: Response) {
        try {
            console.log('[getPortfolio] User ID:', req.user!.id);
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            console.log('[getPortfolio] Student found:', student);

            if (!student || student.length === 0) {
                return res.status(404).json({ error: 'Student profile not found' });
            }

            // Use the shared service logic
            const portfolio = await studentPortfolioService.getAllPortfolioEntries(student[0].id);
            console.log('[getPortfolio] Entries found:', portfolio.length);
            res.json(portfolio);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/announcements
    async getAnnouncements(req: AuthRequest, res: Response) {
        try {
            const announcements = await announcementService.getAllAnnouncements();
            res.json(announcements);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/events
    async getEvents(req: AuthRequest, res: Response) {
        try {
            const events = await eventService.getAllEvents();
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const studentController = new StudentController();
