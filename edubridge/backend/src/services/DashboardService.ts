import { pool } from '../config/database';

export class DashboardService {
    // Get admin dashboard data
    async getAdminDashboard() {
        const [studentCount]: any = await pool.query('SELECT COUNT(*) as count FROM students');
        const [teacherCount]: any = await pool.query('SELECT COUNT(*) as count FROM teachers');
        const [parentCount]: any = await pool.query('SELECT COUNT(*) as count FROM parents');

        // Get average attendance
        const [attendanceStats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

        const avgAttendance = attendanceStats[0].total > 0
            ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
            : 0;

        // Get upcoming events
        const upcomingEvents = await eventService.getUpcomingEvents();

        return {
            totalStudents: studentCount[0].count,
            totalTeachers: teacherCount[0].count,
            totalParents: parentCount[0].count,
            averageAttendance: avgAttendance,
            upcomingEvents: upcomingEvents.slice(0, 3),
        };
    }

    // Get teacher dashboard data
    async getTeacherDashboard(teacherId: number) {
        // Get number of classes taught
        const [classCount]: any = await pool.query(
            'SELECT COUNT(DISTINCT class_id) as count FROM timetable WHERE teacher_id = ?',
            [teacherId]
        );

        // Get pending assignments (not marked)
        const [pendingAssignments]: any = await pool.query(`
      SELECT COUNT(DISTINCT sub.id) as count
      FROM assignment_submissions sub
      JOIN assignments a ON sub.assignment_id = a.id
      LEFT JOIN assignment_marks am ON sub.id = am.assignment_submission_id
      WHERE a.created_by = ? AND am.id IS NULL
    `, [teacherId]);

        // Get upcoming exams
        const [upcomingExams] = await pool.query(`
      SELECT * FROM exams
      WHERE exam_date >= CURDATE()
      ORDER BY exam_date ASC
      LIMIT 4
    `);

        // Get students present today
        const [todayAttendance]: any = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance
      WHERE date = CURDATE() AND status = 'present'
    `);

        return {
            myClasses: classCount[0].count,
            pendingAssignments: pendingAssignments[0].count,
            upcomingExams: upcomingExams,
            studentsPresentToday: todayAttendance[0].count,
        };
    }

    // Get student dashboard data
    async getStudentDashboard(studentId: number) {
        // Get pending assignments
        const [student]: any = await pool.query('SELECT grade FROM students WHERE id = ?', [studentId]);

        const [pendingAssignments] = await pool.query(`
      SELECT a.*
      FROM assignments a
      LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
      WHERE a.grade = ? AND sub.id IS NULL AND a.due_date >= CURDATE()
      ORDER BY a.due_date ASC
      LIMIT 5
    `, [studentId, student[0].grade]);

        // Get upcoming exams
        const [upcomingExams] = await pool.query(`
      SELECT * FROM exams
      WHERE grade = ? AND exam_date >= CURDATE()
      ORDER BY exam_date ASC
      LIMIT 3
    `, [student[0].grade]);

        // Get attendance percentage
        const [attendanceStats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
      WHERE student_id = ?
    `, [studentId]);

        const attendance = attendanceStats[0].total > 0
            ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
            : 0;

        return {
            pendingAssignments,
            upcomingExams,
            attendance,
        };
    }

    // Get parent dashboard data
    async getParentDashboard(parentId: number) {
        // Get children
        const [children] = await pool.query(`
      SELECT s.id, s.full_name, s.grade, s.section
      FROM students s
      JOIN parents p ON s.parent_id = p.user_id
      WHERE p.user_id = ?
    `, [parentId]);

        return {
            children,
        };
    }
}

import { eventService } from './AnnouncementService';
export const dashboardService = new DashboardService();
