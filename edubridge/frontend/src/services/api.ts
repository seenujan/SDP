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
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;


// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    activate: (token: string, password: string) =>
        api.post('/auth/activate', { token, password }),
    verifyToken: (token: string) => api.get(`/auth/verify-token?token=${token}`),
    requestPasswordReset: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getAllUsers: () => api.get('/admin/users'),
    getUserById: (id: number) => api.get(`/admin/users/${id}`),
    createUser: (userData: any) => api.post('/admin/users', userData),
    createParent: (data: any) => api.post('/admin/users/parent', data),
    createStudent: (data: any) => api.post('/admin/users/student', data),
    createTeacher: (data: any) => api.post('/admin/users/teacher', data),
    updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
    toggleUserStatus: (id: number) => api.patch(`/admin/users/${id}/status`),
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
    // Student Portfolio
    getGrades: () => api.get('/admin/portfolio/grades'),
    getSectionsForGrade: (grade: string) => api.get(`/admin/portfolio/grades/${encodeURIComponent(grade)}/sections`),
    getStudentsByFilter: (grade?: string, section?: string) =>
        api.get('/admin/portfolio/students', { params: { grade, section } }),
    getStudentPortfolio: (studentId: number) => api.get(`/admin/portfolio/student/${studentId}`),
    updatePortfolioEntry: (entryId: number, data: any) => api.put(`/admin/portfolio/entry/${entryId}`, data),
    deletePortfolioEntry: (entryId: number) => api.delete(`/admin/portfolio/entry/${entryId}`),
    // Certificate Management
    getAllCertificates: () => api.get('/admin/certificates'),
    getCertificateTypes: () => api.get('/admin/certificate-types'),
    createCertificate: (data: any) => api.post('/admin/certificates', data),
    deleteCertificate: (id: number) => api.delete(`/admin/certificates/${id}`),
    // Progress Card Generation
    getProgressCardData: (studentId: number, termId?: number) =>
        api.get(`/admin/progress-card/${studentId}`, { params: { termId } }),
    // Reports
    getAttendanceReport: (classId: string, startDate: string, endDate: string) =>
        api.get('/admin/reports/attendance', { params: { classId, startDate, endDate } }),
    getExamReport: (grade: string, examId?: string) =>
        api.get('/admin/reports/exams', { params: { grade, examId } }),
    getCertificateReport: (typeId?: string, startDate?: string, endDate?: string) =>
        api.get('/admin/reports/certificates', { params: { typeId, startDate, endDate } }),
    getScholarshipReport: (startDate?: string, endDate?: string) =>
        api.get('/admin/reports/scholarships', { params: { startDate, endDate } }),
    getUserReport: (role?: string, status?: string) =>
        api.get('/admin/reports/users', { params: { role, status } }),
    getPTMFeedbackReport: (startDate?: string, endDate?: string) =>
        api.get('/admin/reports/ptm-feedback', { params: { startDate, endDate } }),
    getEligibleStudents: (filters: { incomeLimit?: number; maxRank?: number; grade?: string; search?: string }) =>
        api.get('/admin/scholarships/eligible', { params: filters }),
    getSubjects: () => api.get('/admin/subjects'),
};

// Teacher API
export const teacherAPI = {
    getDashboard: () => api.get('/teacher/dashboard'),
    markAttendance: (attendance: any[]) => api.post('/teacher/attendance', { attendance }),
    getMyAssignments: () => api.get('/teacher/assignments'),
    createAssignment: (data: any) => api.post('/teacher/assignments', data),
    getSubmissions: (assignmentId: number) =>
        api.get(`/teacher/assignments/${assignmentId}/submissions`),
    markSubmission: (submissionId: number, marks: number, feedback: string) =>
        api.post(`/teacher/submissions/${submissionId}/mark`, { marks, feedback }),
    uploadAssignmentMarks: (assignmentId: number, marks: any[]) =>
        api.post('/teacher/assignments/marks/upload', { assignmentId, marks }),
    getAllSubjects: () => api.get('/teacher/subjects'),
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
    getExamSubmissions: (id: number) => api.get(`/teacher/exams/${id}/submissions`),
    getStudentAttemptDetails: (attemptId: number) => api.get(`/teacher/exams/attempt/${attemptId}`),
    // Marks
    uploadMarks: (marks: any[]) => api.post('/teacher/marks/upload', { marks }),
    getMarksByExam: (examId: number) => api.get(`/teacher/marks/${examId}`),
    // Term Marks
    uploadTermMarks: (marks: any[]) => api.post('/teacher/term-marks/upload', { marks }),
    getTermMarks: (classId: number, term: string, subjectId: number) =>
        api.get(`/teacher/term-marks/${classId}/${term}/${subjectId}`),
    // Question Bank
    getQuestions: (filters?: any) => api.get('/teacher/question-bank', { params: filters }),
    createQuestion: (data: any) => api.post('/teacher/question-bank', data),
    updateQuestion: (id: number, data: any) => api.put(`/teacher/question-bank/${id}`, data),
    deleteQuestion: (id: number) => api.delete(`/teacher/question-bank/${id}`),
    // Student Portfolio
    getStudentPortfolio: (studentId: number) => api.get(`/teacher/student-portfolio/${studentId}`),
    addPortfolioEntry: (data: { studentId: number, performanceSummary: string, activitiesAchievements: string, areasImprovement: string, disciplineRemarks: string }) =>
        api.post('/teacher/student-portfolio', data),
    // PTM Booking
    getPTMRequests: (status?: string) => api.get('/teacher/ptm-requests', { params: { status } }),
    initiatePTM: (data: any) => api.post('/teacher/ptm-requests', data),
    updatePTMStatus: (id: number, data: any) => api.put(`/teacher/ptm-requests/${id}`, data),

    // Announcements & Events
    getAnnouncements: () => api.get('/teacher/announcements'),
    createAnnouncement: (data: any) => api.post('/teacher/announcements', data),
    updateAnnouncement: (id: number, data: any) => api.put(`/teacher/announcements/${id}`, data),
    deleteAnnouncement: (id: number) => api.delete(`/teacher/announcements/${id}`),

    getEvents: () => api.get('/teacher/events'),
    createEvent: (data: any) => api.post('/teacher/events', data),
    updateEvent: (id: number, data: any) => api.put(`/teacher/events/${id}`, data),
    deleteEvent: (id: number) => api.delete(`/teacher/events/${id}`),
};

// Student API
export const studentAPI = {
    getDashboard: () => api.get('/student/dashboard'),
    getAssignments: () => api.get('/student/assignments'),
    submitAssignment: (assignmentId: number, formData: FormData) =>
        api.post(`/student/assignments/${assignmentId}/submit`, formData),
    getMySubmissions: () => api.get('/student/submissions'),
    getAttendance: () => api.get('/student/attendance'),
    getAnnouncements: () => api.get('/student/announcements'),
    getExams: () => api.get('/student/exams'),
    getExam: (id: number) => api.get(`/student/exams/${id}`),
    saveAnswer: (id: number, data: any) => api.post(`/student/exams/${id}/answer`, data),
    submitExamAttempt: (id: number, answers: any[]) => api.post(`/student/exams/${id}/submit-attempt`, { answers }),
    getExamResult: (id: number) => api.get(`/student/exams/${id}/result`),
    // Todos
    // Todos
    getTodos: () => api.get('/student/todos'),
    createTodo: (data: any) => api.post('/student/todos', data),
    updateTodo: (id: number, data: any) => api.put(`/student/todos/${id}`, data),
    deleteTodo: (id: number) => api.delete(`/student/todos/${id}`),
    toggleTodoStatus: (id: number) => api.patch(`/student/todos/${id}/toggle`),
    getResults: () => api.get('/student/results'),
    getPortfolio: () => api.get('/student/portfolio'),
    getTimetable: () => api.get('/student/timetable'),
    getEvents: () => api.get('/student/events'),
};

// Parent API
export const parentAPI = {
    getDashboard: () => api.get('/parent/dashboard'),
    getChildAttendance: (childId: number) =>
        api.get(`/parent/child/${childId}/attendance`),
    getChildProgress: (childId: number) =>
        api.get(`/parent/child/${childId}/progress`),
    getChildPortfolio: (childId: number) =>
        api.get(`/parent/child/${childId}/portfolio`),
    getChildResults: (childId: number) =>
        api.get(`/parent/child/${childId}/results`),
    getChildTimetable: (childId: number) =>
        api.get(`/parent/child/${childId}/timetable`),
    getAnnouncements: () => api.get('/parent/announcements'),
    getEvents: () => api.get('/parent/events'),
    // PTM
    getMyPTMs: () => api.get('/parent/ptm/my-requests'),
    requestPTM: (data: any) => api.post('/parent/ptm/request', data),
    respondToAlternative: (id: number, status: string) => api.put(`/parent/ptm/${id}/respond`, { status }),
    updatePTMStatus: (id: number, data: any) => api.put(`/parent/ptm/${id}/status`, data),
    getBookedSlots: (teacherId: number, date: string) =>
        api.get(`/parent/teachers/${teacherId}/booked-slots`, { params: { date } }),
    getChildTeachers: (childId: number) => api.get(`/parent/child/${childId}/teachers`),
};

// Profile API (available to all authenticated users)
export const profileAPI = {
    getProfile: () => api.get('/profile'),
    updateProfile: (data: any) => api.put('/profile', data),
    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/profile/change-password', { currentPassword, newPassword }),
};

// Notification API
export const notificationAPI = {
    getNotifications: (limit?: number) => api.get('/notifications', { params: { limit } }),
    markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
};

