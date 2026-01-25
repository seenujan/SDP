import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { attendanceService } from '../services/AttendanceService';
import { assignmentService } from '../services/AssignmentService';
import { studentPortfolioService } from '../services/StudentPortfolioService';
import { ptmBookingService } from '../services/PTMBookingService';
import { pool } from '../config/database';

export class ParentController {
    // GET /api/parent/dashboard
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            const data = await dashboardService.getParentDashboard(req.user!.id);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/parent/child/:childId/attendance
    async getChildAttendance(req: AuthRequest, res: Response) {
        try {
            const childId = parseInt(req.params.childId);

            // Verify this child belongs to this parent
            const [child]: any = await pool.query(
                'SELECT * FROM students WHERE id = ? AND parent_id = ?',
                [childId, req.user!.id]
            );

            if (!child[0]) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const attendance = await attendanceService.getStudentAttendance(childId);
            const stats = await attendanceService.getAttendanceStats(childId);

            res.json({ attendance, stats });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/parent/child/:childId/progress
    async getChildProgress(req: AuthRequest, res: Response) {
        try {
            const childId = parseInt(req.params.childId);

            // Verify this child belongs to this parent
            const [child]: any = await pool.query(
                'SELECT * FROM students WHERE id = ? AND parent_id = ?',
                [childId, req.user!.id]
            );

            if (!child[0]) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const submissions = await assignmentService.getStudentSubmissions(childId);

            res.json({ submissions });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/parent/child/:childId/portfolio
    async getChildPortfolio(req: AuthRequest, res: Response) {
        try {
            const childId = parseInt(req.params.childId);

            // Verify this child belongs to this parent
            const [child]: any = await pool.query(
                'SELECT * FROM students WHERE id = ? AND parent_id = ?',
                [childId, req.user!.id]
            );

            if (!child[0]) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Reuse existing service method
            // We need to import studentPortfolioService first
            const portfolio = await studentPortfolioService.getAllPortfolioEntries(childId);
            res.json(portfolio);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }

    }

    // GET /api/parent/child/:childId/results
    async getChildResults(req: AuthRequest, res: Response) {
        try {
            const childId = parseInt(req.params.childId);

            // Verify this child belongs to this parent
            const [child]: any = await pool.query(
                'SELECT * FROM students WHERE id = ? AND parent_id = ?',
                [childId, req.user!.id]
            );

            if (!child[0]) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Fetch Term Marks
            const [termMarks]: any = await pool.query(`
                SELECT tm.*, t.full_name as teacher_name
                FROM term_marks tm
                JOIN teachers t ON tm.teacher_id = t.user_id
                WHERE tm.student_id = ?
                ORDER BY tm.entered_at DESC
            `, [childId]);

            // Fetch Assignment Marks
            const [assignmentMarks]: any = await pool.query(`
                SELECT am.marks, am.feedback, am.reviewed_at, a.title, a.subject
                FROM assignment_marks am
                JOIN assignment_submissions sub ON am.assignment_submission_id = sub.id
                JOIN assignments a ON sub.assignment_id = a.id
                WHERE sub.student_id = ?
                ORDER BY am.reviewed_at DESC
            `, [childId]);

            // Fetch Online Exam Marks
            const [examMarks]: any = await pool.query(`
                SELECT oem.score, oem.entered_at, e.title, e.subject, e.exam_date
                FROM online_exam_marks oem
                JOIN exams e ON oem.exam_id = e.id
                WHERE oem.student_id = ?
                ORDER BY e.exam_date DESC
            `, [childId]);

            res.json({
                termMarks: termMarks,
                assignmentMarks: assignmentMarks,
                examMarks: examMarks
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // PTM Booking
    async getMyPTMs(req: AuthRequest, res: Response) {
        try {
            const requests = await ptmBookingService.getPTMRequestsByParent(req.user!.id);
            res.json(requests);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async requestPTM(req: AuthRequest, res: Response) {
        try {
            const parentId = req.user!.id;
            const { teacherId, studentId, meetingDate, meetingTime, reason } = req.body;

            // Basic validation
            if (!teacherId || !studentId || !meetingDate || !meetingTime) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const booking = await ptmBookingService.createPTMBooking({
                parent_id: parentId,
                teacher_id: teacherId,
                student_id: studentId,
                meeting_date: meetingDate,
                meeting_time: meetingTime,
                notes: reason,
                initiator: 'parent',
                status: 'pending'
            });
            res.status(201).json(booking);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async respondToAlternative(req: AuthRequest, res: Response) {
        try {
            const { status } = req.body;
            const bookingId = parseInt(req.params.id);

            if (status === 'approved') {
                const booking = await ptmBookingService.acceptAlternative(bookingId);
                res.json(booking);
            } else if (status === 'rejected') {
                // Parent rejects alternative -> Meeting is Rejected
                const booking = await ptmBookingService.rejectPTM(bookingId, 'Parent rejected alternative slot');
                res.json(booking);
            } else {
                return res.status(400).json({ error: 'Invalid response status' });
            }
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
    // Get teachers for a child
    async getChildTeachers(req: AuthRequest, res: Response) {
        try {
            const childId = parseInt(req.params.childId);

            // Verify parent ownership
            const [child]: any = await pool.query(
                'SELECT * FROM students WHERE id = ? AND parent_id = ?',
                [childId, req.user!.id]
            );

            if (!child[0]) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const classId = child[0].class_id;

            // Get Class Teacher
            const [classTeacher]: any = await pool.query(`
                SELECT u.id as teacher_id, u.email, t.full_name, t.subject, 'Class Teacher' as role
                FROM classes c
                JOIN users u ON c.class_teacher_id = u.id
                JOIN teachers t ON u.id = t.user_id
                WHERE c.id = ?
            `, [classId]);

            // Get Subject Teachers from Timetable
            const [subjectTeachers]: any = await pool.query(`
                SELECT u.id as teacher_id, u.email, t.full_name, tt.subject, 'Subject Teacher' as role
                FROM timetable tt
                JOIN users u ON tt.teacher_id = u.id
                JOIN teachers t ON u.id = t.user_id
                WHERE tt.class_id = ?
            `, [classId]);

            // Merge and deduplicate by teacher_id
            const allTeachers = [...classTeacher, ...subjectTeachers];
            const uniqueTeachers = Array.from(new Map(allTeachers.map(item => [item.teacher_id, item])).values());

            res.json(uniqueTeachers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updatePTMStatus(req: AuthRequest, res: Response) {
        try {
            const { status, rejection_reason, alternative_date, alternative_time } = req.body;
            const bookingId = parseInt(req.params.id);

            // Verify booking belongs to parent
            const booking = await ptmBookingService.getPTMBookingById(bookingId);
            if (!booking || booking.parent_id !== req.user!.id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            let updatedBooking;
            if (status === 'approved') {
                updatedBooking = await ptmBookingService.approvePTM(bookingId);
            } else if (status === 'rejected') {
                if (alternative_date && alternative_time) {
                    // Reject with alternative
                    updatedBooking = await ptmBookingService.rejectWithAlternative(
                        bookingId,
                        rejection_reason || 'Reschedule requested by parent',
                        alternative_date,
                        alternative_time
                    );
                } else {
                    // Simple rejection
                    updatedBooking = await ptmBookingService.rejectPTM(bookingId, rejection_reason || 'Rejected by parent');
                }
            } else {
                return res.status(400).json({ error: 'Invalid status' });
            }
            res.json(updatedBooking);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // Get booked slots for a teacher
    async getBookedSlots(req: AuthRequest, res: Response) {
        try {
            const teacherId = parseInt(req.params.teacherId);
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({ error: 'Date is required' });
            }

            const slots = await ptmBookingService.getBookedSlots(teacherId, date as string);
            res.json(slots);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const parentController = new ParentController();
