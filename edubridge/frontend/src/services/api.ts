import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Add token to requests and handle FormData
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Let axios auto-detect Content-Type for FormData
    // Only set JSON if it's not FormData
    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
});

// Handle 401 errors (authentication failures)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;


// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getAllUsers: () => api.get('/admin/users'),
    getUserById: (id: number) => api.get(`/admin/users/${id}`),
    createUser: (userData: any) => api.post('/admin/users', userData),
    updateUser: (id: number, userData: any) => api.put(`/admin/users/${id}`, userData),
    deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
    getStudents: () => api.get('/admin/users/students'),
    getTeachers: () => api.get('/admin/users/teachers'),
    getParents: () => api.get('/admin/users/parents'),
    getParentsDropdown: () => api.get('/admin/users/parents-dropdown'),
    getClasses: () => api.get('/admin/classes'),
    // Timetable
    getTimetable: () => api.get('/admin/timetable'),
    getTimetableByClass: (classId: number) => api.get(`/admin/timetable/class/${classId}`),
    getTimetableById: (id: number) => api.get(`/admin/timetable/${id}`),
    createTimetable: (data: any) => api.post('/admin/timetable', data),
    updateTimetable: (id: number, data: any) => api.put(`/admin/timetable/${id}`, data),
    deleteTimetable: (id: number) => api.delete(`/admin/timetable/${id}`),
    getTeachersDropdown: () => api.get('/admin/timetable/teachers-dropdown'),
    // Announcements & Events
    getAnnouncements: () => api.get('/admin/announcements'),
    createAnnouncement: (data: any) => api.post('/admin/announcements', data),
    updateAnnouncement: (id: number, data: any) => api.put(`/admin/announcements/${id}`, data),
    deleteAnnouncement: (id: number) => api.delete(`/admin/announcements/${id}`),
    getEvents: () => api.get('/admin/events'),
    createEvent: (data: any) => api.post('/admin/events', data),
    updateEvent: (id: number, data: any) => api.put(`/admin/events/${id}`, data),
    deleteEvent: (id: number) => api.delete(`/admin/events/${id}`),
};

// Teacher API
export const teacherAPI = {
    getDashboard: () => api.get('/teacher/dashboard'),
    markAttendance: (attendance: any) => api.post('/teacher/attendance', { attendance }),
    getMyAssignments: () => api.get('/teacher/assignments'),
    createAssignment: (data: any) => api.post('/teacher/assignments', data),
    getSubmissions: (assignmentId: number) =>
        api.get(`/teacher/assignments/${assignmentId}/submissions`),
    markSubmission: (submissionId: number, marks: number, feedback: string) =>
        api.post(`/teacher/submissions/${submissionId}/mark`, { marks, feedback }),
    uploadAssignmentMarks: (assignmentId: number, marks: any[]) =>
        api.post('/teacher/assignments/marks/upload', { assignmentId, marks }),
    getMyClasses: (day?: string) => api.get('/teacher/classes', { params: day ? { day } : {} }),
    getClassStudents: (classId: number) => api.get(`/teacher/classes/${classId}/students`),
    getMyTimetable: () => api.get('/teacher/timetable'),
    getAttendanceHistory: (grade: string, date: string) =>
        api.get('/teacher/attendance/history', { params: { grade, date } }),
    // Exams
    getExams: () => api.get('/teacher/exams'),
    getExamById: (id: number) => api.get(`/teacher/exams/${id}`),
    createExam: (data: any) => api.post('/teacher/exams', data),
    updateExam: (id: number, data: any) => api.put(`/teacher/exams/${id}`, data),
    deleteExam: (id: number) => api.delete(`/teacher/exams/${id}`),
    addQuestionsToExam: (id: number, questions: any[]) =>
        api.post(`/teacher/exams/${id}/questions`, { questions }),
    removeQuestionFromExam: (examId: number, questionId: number) =>
        api.delete(`/teacher/exams/${examId}/questions/${questionId}`),
    publishExam: (id: number) => api.put(`/teacher/exams/${id}/publish`),
    // Marks
    uploadMarks: (marks: any[]) => api.post('/teacher/marks/upload', { marks }),
    getMarksByExam: (examId: number) => api.get(`/teacher/marks/${examId}`),
    // Term Marks
    uploadTermMarks: (marks: any[]) => api.post('/teacher/term-marks/upload', { marks }),
    getTermMarks: (classId: number, term: string, subject: string) =>
        api.get(`/teacher/term-marks/${classId}/${term}/${encodeURIComponent(subject)}`),
    // Question Bank
    getQuestions: (filters?: any) => api.get('/teacher/question-bank', { params: filters }),
    createQuestion: (data: any) => api.post('/teacher/question-bank', data),
    updateQuestion: (id: number, data: any) => api.put(`/teacher/question-bank/${id}`, data),
    deleteQuestion: (id: number) => api.delete(`/teacher/question-bank/${id}`),
    // Student Portfolio
    getStudentPortfolio: (studentId: number) => api.get(`/teacher/student-portfolio/${studentId}`),
    addPortfolioEntry: (data: { studentId: number, performanceSummary: string, activitiesAchievements: string, areasImprovement: string, teacherRemarks: string }) =>
        api.post('/teacher/student-portfolio', data),
    // PTM Booking
    getPTMRequests: (status?: string) => api.get('/teacher/ptm-requests', { params: { status } }),
    updatePTMStatus: (id: number, data: any) => api.put(`/teacher/ptm-requests/${id}`, data),
};

// Student API
export const studentAPI = {
    getDashboard: () => api.get('/student/dashboard'),
    getAssignments: () => api.get('/student/assignments'),
    submitAssignment: (assignmentId: number, submissionFileUrl: string) =>
        api.post(`/student/assignments/${assignmentId}/submit`, { submissionFileUrl }),
    getMySubmissions: () => api.get('/student/submissions'),
    getAttendance: () => api.get('/student/attendance'),
    getAnnouncements: () => api.get('/student/announcements'),
};

// Parent API
export const parentAPI = {
    getDashboard: () => api.get('/parent/dashboard'),
    getChildAttendance: (childId: number) =>
        api.get(`/parent/child/${childId}/attendance`),
    getChildProgress: (childId: number) =>
        api.get(`/parent/child/${childId}/progress`),
    getAnnouncements: () => api.get('/parent/announcements'),
};

// Profile API (available to all authenticated users)
export const profileAPI = {
    getProfile: () => api.get('/profile'),
    updateProfile: (data: any) => api.put('/profile', data),
    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/profile/change-password', { currentPassword, newPassword }),
};
