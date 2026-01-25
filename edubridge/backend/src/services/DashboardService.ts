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
    console.log(`[DashboardService] Fetching dashboard for teacherId: ${teacherId}`);

    // 1. My Classes: Count distinct classes this teacher is assigned to
    const [classCount]: any = await pool.query(
      'SELECT COUNT(DISTINCT class_id) as count FROM timetable WHERE teacher_id = ?',
      [teacherId]
    );

    // 2. Pending Assignments: Submissions for this teacher's assignments that are not yet graded
    const [pendingAssignments]: any = await pool.query(`
      SELECT COUNT(DISTINCT sub.id) as count
      FROM assignment_submissions sub
      JOIN assignments a ON sub.assignment_id = a.id
      LEFT JOIN assignment_marks am ON sub.id = am.assignment_submission_id
      WHERE a.created_by = ? AND am.id IS NULL
    `, [teacherId]);

    // 3. Upcoming Exams: Exams scheduled for the future (System wide or filtered if needed)
    // For now, we show all upcoming exams to keep them informed of school schedule
    const [upcomingExams] = await pool.query(`
      SELECT * FROM exams
      WHERE exam_date >= CURDATE()
      ORDER BY exam_date ASC
      LIMIT 4
    `);

    // 4. Students Present Today: 
    // Count distinct students present TODAY who belong to classes TAUGHT BY THIS TEACHER
    const [todayAttendance]: any = await pool.query(`
      SELECT COUNT(DISTINCT a.student_id) as count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = CURDATE() 
      AND a.status = 'present' 
      AND s.class_id IN (
          SELECT DISTINCT class_id FROM timetable WHERE teacher_id = ?
      )
    `, [teacherId]);

    // 5. Today's Schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let todayName = days[new Date().getDay()];

    // DEMO LOGIC: If weekend, show Monday's schedule so dashboard isn't empty
    if (todayName === 'Saturday' || todayName === 'Sunday') {
      todayName = 'Monday';
    }

    const [todaysSchedule]: any = await pool.query(`
        SELECT 
            t.subject, 
            t.start_time, 
            t.end_time, 
            c.grade, 
            c.section
        FROM timetable t
        JOIN classes c ON t.class_id = c.id
        WHERE t.teacher_id = ? AND t.day_of_week = ?
        ORDER BY t.start_time ASC
    `, [teacherId, todayName]);

    // 6. Recent Activities
    const notifications: any[] = [];

    // A. Assignment Submissions (Last 5)
    const [recentSubmissions]: any = await pool.query(`
        SELECT s.full_name as student_name, a.title as assignment_title, sub.submitted_at
        FROM assignment_submissions sub
        JOIN students s ON sub.student_id = s.id
        JOIN assignments a ON sub.assignment_id = a.id
        WHERE a.created_by = ?
        ORDER BY sub.submitted_at DESC
        LIMIT 3
    `, [teacherId]);

    recentSubmissions.forEach((sub: any) => {
      notifications.push({
        type: 'submission',
        message: 'Assignment submitted',
        detail: `${sub.student_name} - ${sub.assignment_title}`,
        time: sub.submitted_at
      });
    });

    // B. PTM Pending Requests
    const [ptmRequests]: any = await pool.query(`
        SELECT s.full_name as student_name, c.grade, pm.created_at
        FROM ptm_meetings pm
        JOIN students s ON pm.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE pm.teacher_id = ? AND pm.status = 'pending'
        ORDER BY pm.created_at DESC
        LIMIT 3
    `, [teacherId]);

    ptmRequests.forEach((req: any) => {
      notifications.push({
        type: 'ptm',
        message: 'PTM request received',
        detail: `Parent of ${req.student_name} - ${req.grade}`,
        time: req.created_at
      });
    });

    // Sort combined activities by time desc
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return {
      myClasses: classCount[0].count,
      pendingAssignments: pendingAssignments[0].count,
      upcomingExams: upcomingExams,
      studentsPresentToday: todayAttendance[0].count,
      todaysSchedule: todaysSchedule,
      recentActivities: notifications.slice(0, 5) // Top 5
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
