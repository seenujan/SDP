export interface User {
    id: number;
    email: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    full_name?: string;
    subject?: string;
    grade?: string;
    section?: string;
    phone?: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface Student {
    id: number;
    user_id: number;
    full_name: string;
    grade: string;
    section: string;
    date_of_birth?: string;
    email: string;
    parent_name?: string;
}

export interface Teacher {
    id: number;
    user_id: number;
    full_name: string;
    subject: string;
    email: string;
}

export interface Parent {
    id: number;
    user_id: number;
    full_name: string;
    phone: string;
    email: string;
}

export interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    subject: string;
    grade: string;
    assignment_file_url: string;
    created_by: number;
    created_at: string;
    teacher_name?: string;
    submission_count?: number;
}

export interface AssignmentSubmission {
    id: number;
    assignment_id: number;
    student_id: number;
    submission_file_url: string;
    submitted_at: string;
    status: 'on_time' | 'late';
    student_name?: string;
    marks?: number;
    feedback?: string;
}

export interface Attendance {
    id: number;
    student_id: number;
    status: 'present' | 'absent' | 'late';
    date: string;
    class?: string;
    subject?: string;
}

export interface Announcement {
    id: number;
    title: string;
    message: string;
    posted_by: number;
    posted_at: string;
    posted_by_name?: string;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    event_date: string;
    created_by: number;
    created_by_name?: string;
}

export interface DashboardStats {
    totalStudents?: number;
    totalTeachers?: number;
    totalParents?: number;
    averageAttendance?: number;
    myClasses?: number;
    pendingAssignments?: number | Assignment[];
    upcomingExams?: any[];
    upcomingEvents?: Event[];
    studentsPresentToday?: number;
    attendance?: number;
    children?: any[];
}
