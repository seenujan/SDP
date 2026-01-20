import React from 'react';
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
import PTMBooking from './pages/teacher/PTMBooking';

// Student
import StudentDashboard from './pages/student/Dashboard';

// Parent
import ParentDashboard from './pages/parent/Dashboard';

// Common
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

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

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
