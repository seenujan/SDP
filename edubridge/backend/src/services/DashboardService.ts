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
    const upcomingEvents: any = await eventService.getUpcomingEvents();
    const eventsArray = Array.isArray(upcomingEvents) ? upcomingEvents : (upcomingEvents.data || []);

    return {
      totalStudents: studentCount[0].count,
      totalTeachers: teacherCount[0].count,
      totalParents: parentCount[0].count,
      averageAttendance: avgAttendance,
      upcomingEvents: eventsArray.slice(0, 3),
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
    console.log('[DashboardService] getStudentDashboard called for studentId:', studentId);
    // Get pending assignments
    const [student]: any = await pool.query(`
        SELECT c.grade 
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = ?
    `, [studentId]);

    if (!student || student.length === 0) {
      console.error('[DashboardService] Student record not found for ID:', studentId);
      throw new Error('Student record not found in DashboardService');
    }

    const grade = student[0].grade;
    console.log('[DashboardService] Student Grade:', grade);

    console.log('[DashboardService] Fetching pending assignments...');
    const [pendingAssignments] = await pool.query(`
          SELECT a.*
          FROM assignments a
          LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
          WHERE a.grade = ? AND sub.id IS NULL AND a.due_date >= CURDATE()
          ORDER BY a.due_date ASC
          LIMIT 5
        `, [studentId, grade]);
    console.log('[DashboardService] Pending assignments count:', Array.isArray(pendingAssignments) ? pendingAssignments.length : 'N/A');

    // Get upcoming exams
    console.log('[DashboardService] Fetching upcoming exams...');
    const [upcomingExams] = await pool.query(`
          SELECT * FROM exams
          WHERE grade = ? AND exam_date >= CURDATE()
          ORDER BY exam_date ASC
          LIMIT 3
        `, [grade]);
    console.log('[DashboardService] Upcoming exams count:', Array.isArray(upcomingExams) ? upcomingExams.length : 'N/A');

    // Get attendance percentage
    console.log('[DashboardService] Fetching attendance stats...');
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
    console.log('[DashboardService] Attendance calculated:', attendance);

    return {
      pendingAssignments,
      upcomingExams,
      attendance,
    };
  }

  // Get parent dashboard data
  async getParentDashboard(parentId: number) {
    // 1. Get children details
    const [children]: any = await pool.query(`
      SELECT s.id, s.full_name, s.roll_number, u.email, c.grade, c.section, c.id as class_id
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.parent_id = ?
    `, [parentId]);

    if (children.length === 0) {
      return { children: [], notifications: [], upcomingPTM: null };
    }

    const child = children[0]; // Focusing on prime child for dashboard overview

    // 2. Get Attributes
    // Attendance
    const [attendanceStats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
      WHERE student_id = ?
    `, [child.id]);

    child.attendance_percentage = attendanceStats[0].total > 0
      ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
      : 0;

    // Class Rank (Placeholder for now, calculating rank is expensive dynamically)
    child.class_rank = "#3";

    // 3. Notifications (Aggregation)
    const notifications = [];

    // Recent graded assignments
    const [recentGrades]: any = await pool.query(`
      SELECT a.title, am.marks, a.subject, am.reviewed_at as date
      FROM assignment_marks am
      JOIN assignment_submissions sub ON am.assignment_submission_id = sub.id
      JOIN assignments a ON sub.assignment_id = a.id
      WHERE sub.student_id = ?
      ORDER BY am.reviewed_at DESC
      LIMIT 2
    `, [child.id]);

    recentGrades.forEach((g: any) => {
      notifications.push({
        type: 'grade',
        title: `${g.title} graded: ${g.marks}`, // Adjusted to match UI string roughly
        time: g.date
      });
    });

    // Upcoming Exams
    const [upcomingExams]: any = await pool.query(`
      SELECT title, subject, exam_date
      FROM exams
      WHERE (grade = ? OR grade IS NULL) AND exam_date >= CURDATE()
      ORDER BY exam_date ASC
      LIMIT 2
    `, [child.grade]);

    upcomingExams.forEach((e: any) => {
      notifications.push({
        type: 'exam',
        title: `${e.subject} ${e.title} scheduled for ${new Date(e.exam_date).toLocaleDateString()}`,
        time: e.created_at || new Date() // Fallback time
      });
    });

    // Recent Attendance Update
    const [lastAttendance]: any = await pool.query(`
      SELECT date, status
      FROM attendance
      WHERE student_id = ?
      ORDER BY date DESC
      LIMIT 1
    `, [child.id]);

    if (lastAttendance.length > 0) {
      notifications.push({
        type: 'attendance',
        title: `Your child's attendance updated for this week`,
        time: lastAttendance[0].date
      });
    }

    // Sort notifications by time DESC (approximate)
    // notifications.sort(...) - simplified for now, order is mix

    // 4. Upcoming PTM
    const [ptm]: any = await pool.query(`
      SELECT pm.*, t.full_name as teacher_name, t.subject
      FROM ptm_meetings pm
      JOIN teachers t ON pm.teacher_id = t.id
      WHERE pm.student_id = ? AND pm.meeting_date >= CURDATE()
      ORDER BY pm.meeting_date ASC
      LIMIT 1
    `, [child.id]);

    return {
      children,
      selectedChild: child,
      notifications,
      upcomingPTM: ptm[0] || null
    };
  }
}

import { eventService } from './AnnouncementService';
export const dashboardService = new DashboardService();
