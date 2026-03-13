import { pool } from '../config/database';

export class DashboardService {
  // Get admin dashboard data
  async getAdminDashboard() {
    // Run all queries in parallel for speed
    const [
      [studentCountRows],
      [teacherCountRows],
      [parentCountRows],
      [attendanceRows],
      [pendingLeavesRows],
      [announcementsRows],
      [upcomingExamsRows],
      [certsRows],
      [eventsRows],
      [chartRows],
    ]: any[] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM students'),
      pool.query('SELECT COUNT(*) as count FROM teachers'),
      pool.query('SELECT COUNT(*) as count FROM parents'),
      pool.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
        FROM attendance
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `),
      pool.query(`SELECT COUNT(*) as count FROM teacher_leaves WHERE status = 'pending'`),
      pool.query(`
        SELECT id, title, message, posted_at
        FROM announcements
        ORDER BY posted_at DESC
        LIMIT 3
      `),
      pool.query(`
        SELECT e.id, e.title, e.exam_date, e.duration,
               s.subject_name, c.grade, c.section
        FROM exams e
        JOIN subjects s ON e.subject_id = s.id
        JOIN classes c ON e.class_id = c.id
        WHERE e.exam_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          AND e.status = 'published'
        ORDER BY e.exam_date ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT COUNT(*) as count
        FROM certificate_issue
        WHERE MONTH(issue_date) = MONTH(CURDATE())
          AND YEAR(issue_date) = YEAR(CURDATE())
      `),
      pool.query(`
        SELECT id, title, description, event_date
        FROM events
        WHERE event_date >= CURDATE()
        ORDER BY event_date ASC
        LIMIT 3
      `),
      pool.query(`
        SELECT
          DATE_FORMAT(date, '%Y-%m-%d') as day,
          DATE_FORMAT(date, '%d %b')    as label,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status = 'absent'  THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN status = 'late'    THEN 1 ELSE 0 END) as late
        FROM attendance
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE_FORMAT(date, '%Y-%m-%d'), DATE_FORMAT(date, '%d %b')
        ORDER BY day ASC
      `),
    ]);

    const total = attendanceRows[0].total;
    const present = attendanceRows[0].present;
    const avgAttendance = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      totalStudents: studentCountRows[0].count,
      totalTeachers: teacherCountRows[0].count,
      totalParents: parentCountRows[0].count,
      averageAttendance: avgAttendance,
      pendingLeavesCount: pendingLeavesRows[0].count,
      recentAnnouncements: announcementsRows,
      upcomingExams: upcomingExamsRows,
      certificatesThisMonth: certsRows[0].count,
      upcomingEvents: eventsRows,
      attendanceChartData: chartRows,
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
            sub.subject_name as subject, 
            t.start_time, 
            t.end_time, 
            c.grade, 
            c.section
        FROM timetable t
        JOIN classes c ON t.class_id = c.id
        JOIN subjects sub ON t.subject_id = sub.id
        WHERE t.teacher_id = ? AND t.day_of_week = ?
        ORDER BY t.start_time ASC
    `, [teacherId, todayName]);

    // 6. Recent Activities
    const notifications: any[] = [];

    // A. Assignment Submissions (Last 5)
    // AssignmentService handles this, but here we query directly?
    // Assignments has subject_id, need join if we want subject name
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
    // Get grade first
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
          SELECT a.*, sub.subject_name as subject
          FROM assignments a
          JOIN subjects sub ON a.subject_id = sub.id
          LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
          WHERE a.class_id IN (
              SELECT class_id FROM students WHERE id = ?
          ) AND s.id IS NULL AND a.due_date >= CURDATE()
          ORDER BY a.due_date ASC
          LIMIT 5
        `, [studentId, studentId]);
    // Note: Logic for pending assignments was filtering by grade in previous code?
    // Assignments are linked to Class ID usually.
    // Previous code: WHERE a.grade = ? (Assignments table doesn't have grade? It has class_id)
    // Let's check Assignments Schema from AssignmentService.
    // AssignmentService createAssignment uses class_id.
    // getAllAssignments joins classes c.
    // So assignments have class_id.
    // Previous query: WHERE a.grade = ? 
    // If Assignments table has no grade column, the previous query was ALREADY broken or I misunderstood.
    // AssignmentService getAllAssignments shows: SELECT a.* ... JOIN classes c ...
    // So assignments probably do NOT have grade column.
    // The previous code in Step 1187 (line 179) said: WHERE a.grade = ?
    // This implies Assignment table has grade? 
    // Let's check schema.sql in Step 1082:
    // CREATE TABLE assignments ( ... class_id INT ... ); No grade column!
    // So the previous code was definitely broken or relied on a column I don't see.
    // I will fix it to filter by class_id or join classes.
    // Actually, easiest is: JOIN classes c ON a.class_id = c.id WHERE c.grade = ?

    // Corrected logic for Pending Assignments:
    /* 
    const [pendingAssignments] = await pool.query(`
          SELECT a.*, sub_subj.subject_name as subject
          FROM assignments a
          JOIN subjects sub_subj ON a.subject_id = sub_subj.id
          JOIN classes c ON a.class_id = c.id
          LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
          WHERE c.grade = ? AND sub.id IS NULL AND a.due_date >= CURDATE()
          ORDER BY a.due_date ASC
          LIMIT 5
        `, [studentId, grade]);
    */
    // Wait, filtering by Grade might be too broad if there are multiple sections. 
    // Assignments are usually for a specific Class (Grade+Section).
    // So better to filter by student's class_id.

    // Let's use Student's Class ID.
    const [studentClass]: any = await pool.query('SELECT class_id FROM students WHERE id = ?', [studentId]);
    const classId = studentClass[0]?.class_id;

    const [pendingAssignmentsResult] = await pool.query(`
          SELECT a.*, sub_subj.subject_name as subject
          FROM assignments a
          JOIN subjects sub_subj ON a.subject_id = sub_subj.id
          LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
          WHERE a.class_id = ? AND sub.id IS NULL AND a.due_date >= CURDATE()
          ORDER BY a.due_date ASC
          LIMIT 5
        `, [studentId, classId]);


    // Get upcoming exams
    console.log('[DashboardService] Fetching upcoming exams...');
    const [upcomingExamsResult] = await pool.query(`
          SELECT e.*, sub.subject_name as subject
          FROM exams e
          JOIN subjects sub ON e.subject_id = sub.id
          WHERE e.class_id = ? AND e.status = 'published' AND e.exam_date >= CURDATE()
          ORDER BY e.exam_date ASC
          LIMIT 3
        `, [classId]);
    // Note: Exams linked to class_id usually? 
    // Schema Step 1082: exams has class_id.
    // Previous code used grade.
    // I joined classes relative to exam to filter by grade (if exams are grade-wide?)
    // If exams are class-specific, I should use classId.
    // Let's assume exams are class specific.
    /*
    const [upcomingExamsResult] = await pool.query(`
          SELECT e.*, sub.subject_name as subject
          FROM exams e
          JOIN subjects sub ON e.subject_id = sub.id
          WHERE e.class_id = ? AND e.exam_date >= CURDATE()
          ORDER BY e.exam_date ASC
          LIMIT 3
        `, [classId]);
    */
    // I will stick to class_id for consistency.

    console.log('[DashboardService] Upcoming exams count:', Array.isArray(upcomingExamsResult) ? upcomingExamsResult.length : 'N/A');

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

    // Get today's schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let todayName = days[new Date().getDay()];
    // For demo/weekend, show Monday
    if (todayName === 'Saturday' || todayName === 'Sunday') todayName = 'Monday';

    const [todaysSchedule]: any = await pool.query(`
        SELECT 
            sub.subject_name as subject, 
            t.start_time, 
            t.end_time,
            te.full_name as teacher_name
        FROM timetable t
        JOIN subjects sub ON t.subject_id = sub.id
        LEFT JOIN teachers te ON t.teacher_id = te.user_id
        WHERE t.class_id = ? AND t.day_of_week = ?
        ORDER BY t.start_time ASC
    `, [classId, todayName]);

    // Aggregate Recent Activities
    const activities: any[] = [];

    // Assignments Recently Posted
    const [recentAssignments]: any = await pool.query(`
        SELECT a.title, sub.subject_name as subject, a.created_at as time
        FROM assignments a
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE a.class_id = ?
        ORDER BY a.created_at DESC
        LIMIT 3
    `, [classId]);
    recentAssignments.forEach((a: any) => activities.push({ type: 'assignment', message: 'New assignment posted', detail: `${a.title} (${a.subject})`, time: a.time }));

    // Recently Graded
    const [recentGrades]: any = await pool.query(`
        SELECT a.title, am.marks, sub.subject_name as subject, am.reviewed_at as time
        FROM assignment_marks am
        JOIN assignment_submissions s ON am.assignment_submission_id = s.id
        JOIN assignments a ON s.assignment_id = a.id
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE s.student_id = ?
        ORDER BY am.reviewed_at DESC
        LIMIT 3
    `, [studentId]);
    recentGrades.forEach((g: any) => activities.push({ type: 'grade', message: 'Assignment graded', detail: `${g.title} - ${g.marks}%`, time: g.time }));

    // Sort activities
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return {
      pendingAssignments: pendingAssignmentsResult,
      upcomingExams: upcomingExamsResult,
      attendance,
      todaysSchedule,
      recentActivities: activities.slice(0, 5)
    };
  }

  // Get parent dashboard data
  async getParentDashboard(parentId: number, selectedChildId?: number) {
    // 1. Get children details
    const [children]: any = await pool.query(`
      SELECT s.id, s.full_name, s.roll_number, u.email, c.grade, c.section, c.id as class_id, s.class_rank
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.parent_id = ?
    `, [parentId]);

    if (children.length === 0) {
      return { children: [], notifications: [], upcomingPTM: null };
    }

    // Determine the child to focus on (either the passed ID or the first one)
    let primaryChild = children[0];
    if (selectedChildId) {
      const found = children.find((c: any) => c.id === selectedChildId);
      if (found) primaryChild = found;
    }

    // Enhance children with attendance and DYNAMIC Rank (for consistency with Progress View)
    for (const child of children) {
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

      // Calculate dynamic rank for 'Term 1' (matching ProgressCardService logic)
      const [rankRow]: any = await pool.query(`
        WITH ClassTermMarks AS (
            SELECT 
                tm.student_id,
                SUM(tm.marks) as total_marks
            FROM term_marks tm
            JOIN students s ON tm.student_id = s.id
            WHERE tm.term = 'Term 1' AND s.class_id = ?
            GROUP BY tm.student_id
        ),
        Ranks AS (
            SELECT 
                student_id,
                RANK() OVER (ORDER BY total_marks DESC) as term_rank
            FROM ClassTermMarks
        )
        SELECT term_rank FROM Ranks WHERE student_id = ?
      `, [child.class_id, child.id]);

      child.class_rank = rankRow.length > 0 ? `#${rankRow[0].term_rank}` : 'N/A';
    }


    // 2. Notifications (Aggregation)
    const notifications: any[] = [];

    // Recent graded assignments
    const [recentGrades]: any = await pool.query(`
      SELECT a.title, am.marks, sub_subj.subject_name as subject, am.reviewed_at as date
      FROM assignment_marks am
      JOIN assignment_submissions sub ON am.assignment_submission_id = sub.id
      JOIN assignments a ON sub.assignment_id = a.id
      JOIN subjects sub_subj ON a.subject_id = sub_subj.id
      WHERE sub.student_id = ?
      ORDER BY am.reviewed_at DESC
      LIMIT 3
    `, [primaryChild.id]);

    recentGrades.forEach((g: any) => {
      notifications.push({
        type: 'grade',
        title: `${g.title} (${g.subject}) graded: ${g.marks}%`,
        time: g.date
      });
    });

    // Upcoming Exams
    const [upcomingExams]: any = await pool.query(`
      SELECT e.title, sub.subject_name as subject, e.exam_date, e.created_at
      FROM exams e
      JOIN subjects sub ON e.subject_id = sub.id
      WHERE e.class_id = ? AND e.exam_date >= CURDATE()
      ORDER BY e.exam_date ASC
      LIMIT 3
    `, [primaryChild.class_id]);

    upcomingExams.forEach((e: any) => {
      notifications.push({
        type: 'exam',
        title: `Upcoming ${e.subject} Exam: ${e.title} on ${new Date(e.exam_date).toLocaleDateString()}`,
        time: e.created_at || new Date()
      });
    });

    // Recent Attendance Update
    const [lastAttendance]: any = await pool.query(`
      SELECT date, status
      FROM attendance
      WHERE student_id = ?
      ORDER BY date DESC
      LIMIT 1
    `, [primaryChild.id]);

    if (lastAttendance.length > 0) {
      notifications.push({
        type: 'attendance',
        title: `Attendance updated: ${lastAttendance[0].status} on ${new Date(lastAttendance[0].date).toLocaleDateString()}`,
        time: lastAttendance[0].date
      });
    }

    // Sort notifications by time DESC
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // 4. Upcoming PTM
    const [ptm]: any = await pool.query(`
      SELECT pm.*, t.full_name as teacher_name, sub.subject_name as subject
      FROM ptm_meetings pm
      LEFT JOIN teachers t ON pm.teacher_id = t.user_id
      LEFT JOIN subjects sub ON t.subject_id = sub.id
      WHERE pm.student_id = ? AND pm.meeting_date >= CURDATE() AND pm.status = 'approved'
      ORDER BY pm.meeting_date ASC, pm.meeting_time ASC
      LIMIT 1
    `, [primaryChild.id]);

    return {
      children,
      selectedChild: primaryChild,
      notifications: notifications.slice(0, 5),
      upcomingPTM: ptm[0] || null
    };
  }
}

import { eventService } from './AnnouncementService';
export const dashboardService = new DashboardService();
