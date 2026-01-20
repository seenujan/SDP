import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { assignmentService } from '../services/AssignmentService';
import { attendanceService } from '../services/AttendanceService';
import { pool } from '../config/database';

export class StudentController {
    // GET /api/student/dashboard
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            // Get student ID from user ID
            const [student]: any = await pool.query(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const data = await dashboardService.getStudentDashboard(student[0].id);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/student/assignments
    async getAssignments(req: AuthRequest, res: Response) {
        try {
            const [student]: any = await pool.query(
                'SELECT id, grade FROM students WHERE user_id = ?',
                [req.user!.id]
            );

            const assignments = await assignmentService.getAssignmentsByGrade(student[0].grade);
            res.json(assignments);
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
}

export const studentController = new StudentController();
