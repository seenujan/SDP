import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth
import Login from './pages/auth/Login';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Announcements from './pages/admin/Announcements';
import Events from './pages/admin/Events';
import Timetable from './pages/admin/Timetable';
import AdminStudentPortfolio from './pages/admin/StudentPortfolio';
import Certificates from './pages/admin/Certificates';
import ProgressCard from './pages/admin/ProgressCard';
import Reports from './pages/admin/Reports';

// Teacher
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherAssignments from './pages/teacher/Assignments';
import AssignmentSubmissions from './pages/teacher/AssignmentSubmissions';
import TeacherTimetable from './pages/teacher/Timetable';
import MyClasses from './pages/teacher/MyClasses';
import Exams from './pages/teacher/Exams';
import UploadMarks from './pages/teacher/UploadMarks';
import QuestionBank from './pages/teacher/QuestionBank';
import StudentPortfolio from './pages/teacher/StudentPortfolio';
import ExamSubmissions from './pages/teacher/ExamSubmissions';
import ReviewStudentExam from './pages/teacher/ReviewStudentExam';
import PTMBooking from './pages/teacher/PTMBooking';
import TeacherAnnouncements from './pages/teacher/Announcements';
import TeacherEvents from './pages/teacher/Events';

// Student
import StudentDashboard from './pages/student/Dashboard';
import StudentToDoList from './pages/student/ToDoList';
import StudentAssignments from './pages/student/Assignments';
import StudentExams from './pages/student/Exams';
import TakeExam from './pages/student/TakeExam';
import ReviewExam from './pages/student/ReviewExam';
import StudentResults from './pages/student/Results';
import StudentMyPortfolio from './pages/student/Portfolio';
import StudentMyAttendance from './pages/student/Attendance';
import StudentMyProgress from './pages/student/Progress';
import StudentMyEvents from './pages/student/Events';
import StudentAnnouncements from './pages/student/Announcements';

// Parent
import ParentDashboard from './pages/parent/Dashboard';
import ChildResults from './pages/parent/ChildResults';
import ParentAnnouncements from './pages/parent/Announcements';
import ParentEvents from './pages/parent/Events';
import ChildPortfolio from './pages/parent/ChildPortfolio';
import ViewProgress from './pages/parent/ViewProgress';
import ParentAttendance from './pages/parent/Attendance';
import ParentPTMBooking from './pages/parent/PTMBooking';

// Common
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Notifications from './pages/Notifications';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Admin Routes */}
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <UserManagement />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/announcements"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <Announcements />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/events"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <Events />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/timetable"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <Timetable />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/student-portfolio"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminStudentPortfolio />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/certificates"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <Certificates />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/progress-card"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <ProgressCard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/reports"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <Reports />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/*"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Teacher Routes */}
                    <Route
                        path="/teacher/dashboard"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/attendance"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherAttendance />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/assignments"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherAssignments />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/assignments/:assignmentId/submissions"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <AssignmentSubmissions />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/timetable"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherTimetable />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/classes"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <MyClasses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/exams"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <Exams />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/upload-marks"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <UploadMarks />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/question-bank"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <QuestionBank />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/exams/:id/submissions"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <ExamSubmissions />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/exams/review/:attemptId"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <ReviewStudentExam />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/student-portfolio"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <StudentPortfolio />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/ptm-booking"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <PTMBooking />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/announcements"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherAnnouncements />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/events"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherEvents />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/*"
                        element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Student Routes */}
                    <Route
                        path="/student/dashboard"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/todo"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentToDoList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/assignments"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentAssignments />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/exams"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentExams />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/exams/:id/take"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <TakeExam />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/exams/:id/review"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <ReviewExam />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/results"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentResults />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/portfolio"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentMyPortfolio />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/attendance"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentMyAttendance />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/progress"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentMyProgress />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/events"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentMyEvents />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/announcements"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentAnnouncements />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/*"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Parent Routes */}
                    <Route
                        path="/parent/dashboard"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ParentDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parent/announcements"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ParentAnnouncements />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parent/events"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ParentEvents />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/parent/attendance"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ParentAttendance />
                            </ProtectedRoute>
                        }
                    />


                    <Route
                        path="/parent/child-portfolio"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ChildPortfolio />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parent/view-progress"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ViewProgress />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parent/child-results"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ChildResults />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parent/ptm-booking"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ParentPTMBooking />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parent/*"
                        element={
                            <ProtectedRoute requiredRole="parent">
                                <ParentDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Profile Route - Available to all authenticated users */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* Change Password Route - Available to all authenticated users */}
                    <Route
                        path="/change-password"
                        element={
                            <ProtectedRoute>
                                <ChangePassword />
                            </ProtectedRoute>
                        }
                    />

                    {/* Notifications Route */}
                    <Route
                        path="/notifications"
                        element={
                            <ProtectedRoute>
                                <Notifications />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
