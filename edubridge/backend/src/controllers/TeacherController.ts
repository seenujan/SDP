import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { attendanceService } from '../services/AttendanceService';
import { assignmentService } from '../services/AssignmentService';
import { dashboardService } from '../services/DashboardService';
import { timetableService } from '../services/TimetableService';
import examService from '../services/ExamService';
import { termMarksService } from '../services/TermMarksService';
import { questionBankService } from '../services/QuestionBankService';
import { studentPortfolioService } from '../services/StudentPortfolioService';
import { ptmBookingService } from '../services/PTMBookingService';
import { announcementService, eventService } from '../services/AnnouncementService';
import { subjectService } from '../services/SubjectService';
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

    // Subjects
    async getAllSubjects(req: AuthRequest, res: Response) {
        try {
            const [subjects] = await pool.query(`
                SELECT s.* 
                FROM subjects s
                JOIN teachers t ON t.subject_id = s.id
                WHERE t.user_id = ?
            `, [req.user!.id]);
            res.json(subjects);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
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
                classId: parseInt(req.body.classId),
                subjectId: parseInt(req.body.subjectId),
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
                    t.id as timetable_id,
                    c.id,
                    c.grade,
                    c.section,
                    CONCAT(c.grade, ' ', c.section) as class_name,
                    ts.subject_name as subject,
                    ts.id as subject_id
                FROM timetable t
                JOIN classes c ON t.class_id = c.id
                JOIN subjects ts ON t.subject_id = ts.id
                WHERE t.teacher_id = ?
            `;

            const params: any[] = [teacherId];

            // Filter by day of week if provided
            if (day && typeof day === 'string') {
                query += ' AND t.day_of_week = ?';
                params.push(day);
            }

            query += `
                ORDER BY c.grade, c.section, ts.subject_name
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
                s.parent_id,
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
            const { classId, term, subjectId } = req.params;

            console.log(`Fetching term marks: classId = ${classId}, term = ${term}, subjectId = ${subjectId} `);

            const marks = await termMarksService.getTermMarksByClass(
                parseInt(classId),
                term,
                parseInt(subjectId)
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
            const questions = await questionBankService.getAllQuestions(
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
                req.body,
                req.user!.id
            );
            res.json(question);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteQuestion(req: AuthRequest, res: Response) {
        try {
            await questionBankService.deleteQuestion(parseInt(req.params.id), req.user!.id);
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
            const userId = req.user!.id;

            // Get teacher details to find teacher_id
            const [teachers]: any = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [userId]);

            if (teachers.length === 0) {
                return res.status(404).json({ error: 'Teacher profile not found' });
            }

            const teacherId = teachers[0].id;
            const { studentId, performanceSummary, activitiesAchievements, areasImprovement, disciplineRemarks, teacherRemarks } = req.body;

            // Handle both legacy and new field names from frontend
            const remarks = disciplineRemarks || teacherRemarks;

            const entry = await studentPortfolioService.addPortfolioEntry({
                studentId,
                teacherId,
                performanceSummary,
                activitiesAchievements,
                areasImprovement,
                disciplineRemarks: remarks
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

    async initiatePTM(req: AuthRequest, res: Response) {
        try {
            const teacherId = req.user!.id;
            const { studentId, parentId, meetingDate, meetingTime, notes } = req.body;

            // Basic validation
            if (!studentId || !parentId || !meetingDate || !meetingTime) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const booking = await ptmBookingService.createPTMBooking({
                teacher_id: teacherId,
                student_id: studentId,
                parent_id: parentId,
                meeting_date: meetingDate,
                meeting_time: meetingTime,
                notes: notes,
                initiator: 'teacher',
                status: 'pending'
            });
            res.status(201).json(booking);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async updatePTMStatus(req: AuthRequest, res: Response) {
        try {
            const { status, rejection_reason, alternative_date, alternative_time } = req.body;
            const bookingId = parseInt(req.params.id);

            let booking;
            if (status === 'approved') {
                booking = await ptmBookingService.approvePTM(bookingId);
            } else if (status === 'rejected') {
                if (alternative_date && alternative_time) {
                    // Reject with alternative
                    booking = await ptmBookingService.rejectWithAlternative(
                        bookingId,
                        rejection_reason || 'Reschedule requested',
                        alternative_date,
                        alternative_time
                    );
                } else {
                    // Simple rejection
                    booking = await ptmBookingService.rejectPTM(bookingId, rejection_reason || 'Rejected');
                }
            } else if (status === 'completed') {
                booking = await ptmBookingService.completePTM(bookingId);
            } else {
                return res.status(400).json({ error: 'Invalid status' });
            }
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

    // Announcements
    async createAnnouncement(req: AuthRequest, res: Response) {
        try {
            const announcement = await announcementService.createAnnouncement({
                ...req.body,
                postedBy: req.user!.id,
            });
            res.status(201).json(announcement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getAnnouncements(req: AuthRequest, res: Response) {
        try {
            // Teachers can see all announcements (or we could filter, but typically they see all school announcements)
            // Ideally we should filter by "created by me" OR "school wide". 
            // For now, let's allow them to see all, similar to Admin/Users.
            const announcements = await announcementService.getAllAnnouncements();
            res.json(announcements);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateAnnouncement(req: AuthRequest, res: Response) {
        try {
            // TODO: Add check to ensure teacher only updates THEIR own announcement
            const announcement = await announcementService.updateAnnouncement(
                parseInt(req.params.id),
                req.body
            );
            res.json(announcement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteAnnouncement(req: AuthRequest, res: Response) {
        try {
            // TODO: Add check to ensure teacher only deletes THEIR own announcement
            await announcementService.deleteAnnouncement(parseInt(req.params.id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Events
    async createEvent(req: AuthRequest, res: Response) {
        try {
            const event = await eventService.createEvent({
                ...req.body,
                createdBy: req.user!.id,
            });
            res.status(201).json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getEvents(req: AuthRequest, res: Response) {
        try {
            const events = await eventService.getAllEvents();
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateEvent(req: AuthRequest, res: Response) {
        try {
            const event = await eventService.updateEvent(
                parseInt(req.params.id),
                req.body
            );
            res.json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteEvent(req: AuthRequest, res: Response) {
        try {
            await eventService.deleteEvent(parseInt(req.params.id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const teacherController = new TeacherController();
