import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Megaphone,
    FileText,
    BookOpen,
    GraduationCap,
    ClipboardList,
    BarChart3,
    LogOut,
    UserCircle,
    Lock,
    School,
    Upload,
    HelpCircle,
    Briefcase,
    CalendarCheck,
    Award,
    TrendingUp,
    CheckSquare,
    TrendingUp as ViewProgress,
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const getMenuItems = () => {
        switch (user?.role) {
            case 'admin':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
                    { icon: Users, label: 'User Management', path: '/admin/users' },
                    { icon: Calendar, label: 'Timetable', path: '/admin/timetable' },
                    { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
                    { icon: School, label: 'Events', path: '/admin/events' },
                    { icon: Briefcase, label: 'Student Portfolio', path: '/admin/student-portfolio' },
                    { icon: Award, label: 'Certificates', path: '/admin/certificates' },
                    { icon: TrendingUp, label: 'Progress Card Generation', path: '/admin/progress-card' },
                    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
                ];
            case 'teacher':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard' },
                    { icon: ClipboardList, label: 'Attendance', path: '/teacher/attendance' },
                    { icon: FileText, label: 'Assignments', path: '/teacher/assignments' },
                    { icon: BookOpen, label: 'Exams', path: '/teacher/exams' },
                    { icon: Upload, label: 'Term Marks', path: '/teacher/upload-marks' },
                    { icon: HelpCircle, label: 'Question Bank', path: '/teacher/question-bank' },
                    { icon: Briefcase, label: 'Student Portfolio', path: '/teacher/student-portfolio' },
                    { icon: CalendarCheck, label: 'PTM Booking', path: '/teacher/ptm-booking' },
                    { icon: School, label: 'Events', path: '/teacher/events' },
                    { icon: Megaphone, label: 'Announcements', path: '/teacher/announcements' },
                ];
            case 'student':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
                    { icon: CheckSquare, label: 'To-Do List', path: '/student/todo' },
                    { icon: FileText, label: 'Assignments', path: '/student/assignments' },
                    { icon: BookOpen, label: 'Exams', path: '/student/exams' },
                    { icon: GraduationCap, label: 'View Results', path: '/student/results' },
                    { icon: Briefcase, label: 'My Portfolio', path: '/student/portfolio' },
                    { icon: ClipboardList, label: 'Attendance', path: '/student/attendance' },
                    { icon: ViewProgress, label: 'View Progress', path: '/student/progress' },
                    { icon: School, label: 'Events', path: '/student/events' },
                    { icon: Megaphone, label: 'Announcements', path: '/student/announcements' },
                ];
            case 'parent':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/parent/dashboard' },
                    { icon: UserCircle, label: 'Child Results', path: '/parent/child-results' },
                    { icon: Briefcase, label: 'Child Portfolio', path: '/parent/child-portfolio' },
                    { icon: ClipboardList, label: 'Attendance', path: '/parent/attendance' },
                    { icon: ViewProgress, label: 'View Progress', path: '/parent/view-progress' },
                    { icon: CalendarCheck, label: 'PTM Booking', path: '/parent/ptm-booking' },
                    { icon: Megaphone, label: 'Announcements', path: '/parent/announcements' },
                    { icon: School, label: 'Events', path: '/parent/events' },
                ];
            default:
                return [];
        }
    };

    const menuItems = getMenuItems();

    return (
        <div className="w-64 bg-white h-screen flex flex-col shadow-lg fixed left-0 top-0">
            {/* Logo */}
            <div className="h-16 px-6 border-b flex items-center">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-bold text-gray-800">EduBridge</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                {menuItems.map((item: any) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isActive
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t">
                {/* Profile - Only for non-admin users */}
                {user?.role !== 'admin' && (
                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isActive
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                        }
                    >
                        <UserCircle size={20} />
                        <span className="font-medium">Profile</span>
                    </NavLink>
                )}

                {/* Change Password - For all users */}
                <NavLink
                    to="/change-password"
                    className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                    }
                >
                    <Lock size={20} />
                    <span className="font-medium">Change Password</span>
                </NavLink>

                {/* Logout - For all users */}
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg w-full transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
