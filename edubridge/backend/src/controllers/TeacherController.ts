import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { attendanceService } from '../services/AttendanceService';
import { assignmentService } from '../services/AssignmentService';
import { dashboardService } from '../services/DashboardService';
import { timetableService } from '../services/TimetableService';
import examService from '../services/ExamService';
import { marksService } from '../services/MarksService';
import { termMarksService } from '../services/TermMarksService';
import { questionBankService } from '../services/QuestionBankService';
import { studentPortfolioService } from '../services/StudentPortfolioService';
import { ptmBookingService } from '../services/PTMBookingService';
import { pool } from '../config/database';

export class TeacherController {
    // GET /api/teacher/dashboard
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            const data = await dashboardService.getTeacherDashboard(req.user!.id);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Attendance
    async markAttendance(req: AuthRequest, res: Response) {
        try {
            const result = await attendanceService.markBulkAttendance(req.body.attendance);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // Assignments
    async createAssignment(req: AuthRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Assignment file is required' });
            }

            const assignment = await assignmentService.createAssignment({
                ...req.body,
                assignmentFileUrl: `uploads/assignments/${req.file.filename}`,
                createdBy: req.user!.id,
            });
            res.status(201).json(assignment);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getMyAssignments(req: AuthRequest, res: Response) {
        try {
            const assignments = await assignmentService.getAssignmentsByTeacher(req.user!.id);
            res.json(assignments);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAssignmentSubmissions(req: AuthRequest, res: Response) {
        try {
            const submissions = await assignmentService.getSubmissionsForAssignment(
                parseInt(req.params.assignmentId)
            );
            res.json(submissions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async markAssignment(req: AuthRequest, res: Response) {
        try {
            const { marks, feedback } = req.body;
            const result = await assignmentService.markAssignment(
                parseInt(req.params.submissionId),
                marks,
                feedback
            );
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async bulkUploadAssignmentMarks(req: AuthRequest, res: Response) {
        try {
            const { assignmentId, marks } = req.body;
            const result = await assignmentService.bulkUploadAssignmentMarks(
                assignmentId,
                marks
            );
            res.json(result);
        } catch (error: any) {
            console.error('Error uploading assignment marks:', error);
            res.status(400).json({ error: error.message || 'Failed to upload assignment marks' });
        }
    }

    // Get teacher's classes (optionally filtered by day of week)
    async getMyClasses(req: AuthRequest, res: Response) {
        try {
            const { day } = req.query;
            const teacherId = req.user!.id;

            console.log('=== getMyClasses ===');
            console.log('Teacher ID:', teacherId);
            console.log('Day filter:', day);

            let query = `
                SELECT DISTINCT 
                    c.id,
                    c.grade,
                    c.section,
                    CONCAT(c.grade, ' ', c.section) as class_name,
                    t.subject
                FROM timetable t
                JOIN classes c ON t.class_id = c.id
                WHERE t.teacher_id = ?
            `;

            const params: any[] = [teacherId];

            // Filter by day of week if provided
            if (day && typeof day === 'string') {
                query += ' AND t.day_of_week = ?';
                params.push(day);
            }

            query += `
                ORDER BY c.grade, c.section, t.subject
            `;

            console.log('Query:', query.replace(/\s+/g, ' ').trim());
            console.log('Params:', params);

            const [classes]: any = await pool.query(query, params);

            // Add student count for each class
            const classesWithCount = await Promise.all(
                classes.map(async (cls: any) => {
                    const [result]: any = await pool.query(
                        'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
                        [cls.id]
                    );
                    return {
                        ...cls,
                        student_count: result[0].count
                    };
                })
            );

            console.log('Classes returned:', classesWithCount);
            console.log('Count:', classesWithCount.length);

            res.json(classesWithCount);
        } catch (error: any) {
            console.error('Error fetching classes:', error.message);
            console.error('Stack:', error.stack);
            res.status(500).json({ error: 'Failed to fetch classes', details: error.message });
        }
    }

    // Get students in a class
    async getClassStudents(req: AuthRequest, res: Response) {
        try {
            const { classId } = req.params;

            console.log('=== getClassStudents ===');
            console.log('Class ID:', classId);

            // Get students by class_id
            const [students] = await pool.query(`
                SELECT 
                    s.id, 
                    s.full_name,
                    s.roll_number,
                    s.class_id,
                    u.email
                FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE s.class_id = ?
                ORDER BY s.roll_number, s.full_name
            `, [classId]);

            console.log('Students found:', Array.isArray(students) ? students.length : 0);

            res.json(students);
        } catch (error: any) {
            console.error('Error fetching students:', error.message);
            res.status(500).json({ error: error.message });
        }
    }

    // Get teacher's timetable
    async getMyTimetable(req: AuthRequest, res: Response) {
        try {
            const timetable = await timetableService.getTimetableByTeacher(req.user!.id);
            res.json(timetable);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get attendance history for a class
    async getAttendanceHistory(req: AuthRequest, res: Response) {
        try {
            const { grade, date } = req.query;

            if (!grade || !date) {
                return res.status(400).json({ error: 'Grade and date are required' });
            }

            const attendance = await attendanceService.getClassAttendance(
                grade as string,
                date as string
            );
            res.json(attendance);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Exams
    async getExams(req: AuthRequest, res: Response) {
        try {
            const exams = await examService.getExamsByTeacher(req.user!.id);
            res.json(exams);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getExamById(req: AuthRequest, res: Response) {
        try {
            const exam = await examService.getExamById(
                parseInt(req.params.id),
                req.user!.id
            );
            res.json(exam);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async createExam(req: AuthRequest, res: Response) {
        try {
            const exam = await examService.createExam(req.body, req.user!.id);
            res.status(201).json(exam);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async updateExam(req: AuthRequest, res: Response) {
        try {
            const exam = await examService.updateExam(
                parseInt(req.params.id),
                req.body,
                req.user!.id
            );
            res.json(exam);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteExam(req: AuthRequest, res: Response) {
        try {
            await examService.deleteExam(parseInt(req.params.id), req.user!.id);
            res.json({ message: 'Exam deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async addQuestionsToExam(req: AuthRequest, res: Response) {
        try {
            const result = await examService.addQuestionsToExam(
                parseInt(req.params.id),
                req.body.questions,
                req.user!.id
            );
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async removeQuestionFromExam(req: AuthRequest, res: Response) {
        try {
            await examService.removeQuestionFromExam(
                parseInt(req.params.id),
                parseInt(req.params.questionId),
                req.user!.id
            );
            res.json({ message: 'Question removed successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async publishExam(req: AuthRequest, res: Response) {
        try {
            const result = await examService.publishExam(
                parseInt(req.params.id),
                req.user!.id
            );
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // Marks
    async uploadMarks(req: AuthRequest, res: Response) {
        try {
            const result = await marksService.uploadMarks(req.body.marks);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getMarksByExam(req: AuthRequest, res: Response) {
        try {
            const marks = await marksService.getMarksByExam(parseInt(req.params.examId));
            res.json(marks);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Term Marks
    async uploadTermMarks(req: AuthRequest, res: Response) {
        try {
            const result = await termMarksService.uploadTermMarks(req.body.marks);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getTermMarks(req: AuthRequest, res: Response) {
        try {
            const { classId, term, subject } = req.params;

            // Decode URL-encoded subject
            const decodedSubject = decodeURIComponent(subject);

            console.log(`Fetching term marks: classId=${classId}, term=${term}, subject=${decodedSubject}`);

            const marks = await termMarksService.getTermMarksByClass(
                parseInt(classId),
                term,
                decodedSubject
            );

            console.log(`Found ${marks.length} term marks`);
            res.json(marks);
        } catch (error: any) {
            console.error('Error in getTermMarks:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Question Bank
    async getQuestions(req: AuthRequest, res: Response) {
        try {
            const questions = await questionBankService.getQuestionsByTeacher(
                req.user!.id,
                req.query
            );
            res.json(questions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async createQuestion(req: AuthRequest, res: Response) {
        try {
            const question = await questionBankService.createQuestion({
                ...req.body,
                teacher_id: req.user!.id,
            });
            res.status(201).json(question);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async updateQuestion(req: AuthRequest, res: Response) {
        try {
            const question = await questionBankService.updateQuestion(
                parseInt(req.params.id),
                req.body
            );
            res.json(question);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteQuestion(req: AuthRequest, res: Response) {
        try {
            await questionBankService.deleteQuestion(parseInt(req.params.id));
            res.json({ message: 'Question deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Student Portfolio
    async getStudentPortfolio(req: AuthRequest, res: Response) {
        try {
            const portfolio = await studentPortfolioService.getStudentPortfolio(
                parseInt(req.params.studentId)
            );
            res.json(portfolio);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Add new portfolio entry
    async addPortfolioEntry(req: AuthRequest, res: Response) {
        try {
            const teacherId = req.user!.id;
            const { studentId, performanceSummary, activitiesAchievements, areasImprovement, teacherRemarks } = req.body;

            const entry = await studentPortfolioService.addPortfolioEntry({
                studentId,
                teacherId,
                performanceSummary,
                activitiesAchievements,
                areasImprovement,
                teacherRemarks
            });

            res.status(201).json({
                success: true,
                message: 'Portfolio entry added successfully',
                entry
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // PTM Booking
    async getPTMRequests(req: AuthRequest, res: Response) {
        try {
            const { status } = req.query;
            const requests = await ptmBookingService.getPTMRequestsByTeacher(
                req.user!.id,
                status as string
            );
            res.json(requests);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updatePTMStatus(req: AuthRequest, res: Response) {
        try {
            const { status, approved_date, approved_time, teacher_remarks } = req.body;
            const booking = await ptmBookingService.updatePTMStatus(
                parseInt(req.params.id),
                status,
                approved_date,
                approved_time,
                teacher_remarks
            );
            res.json(booking);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // Exam Review
    async getExamSubmissions(req: AuthRequest, res: Response) {
        try {
            const submissions = await examService.getExamSubmissions(parseInt(req.params.id));
            res.json(submissions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStudentAttemptDetails(req: AuthRequest, res: Response) {
        try {
            const details = await examService.getStudentAttemptDetails(parseInt(req.params.attemptId));
            res.json(details);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const teacherController = new TeacherController();
