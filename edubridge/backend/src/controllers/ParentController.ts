import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { attendanceService } from '../services/AttendanceService';
import { assignmentService } from '../services/AssignmentService';
import { studentPortfolioService } from '../services/StudentPortfolioService';
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
}

export const parentController = new ParentController();
