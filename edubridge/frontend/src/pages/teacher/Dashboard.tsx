import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import { teacherAPI } from '../../services/api';
import { BookOpen, FileText, ClipboardList, Users } from 'lucide-react';

const TeacherDashboard = () => {
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await teacherAPI.getDashboard();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back! Here's your teaching schedule overview.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="My Classes"
                        value={stats.myClasses || 0}
                        icon={BookOpen}
                        color="blue"
                    />
                    <StatCard
                        title="Pending Assignments"
                        value={stats.pendingAssignments || 0}
                        icon={FileText}
                        color="orange"
                    />
                    <StatCard
                        title="Upcoming Exams"
                        value={stats.upcomingExams?.length || 0}
                        icon={ClipboardList}
                        color="purple"
                    />
                    <StatCard
                        title="Students Present Today"
                        value={stats.studentsPresentToday || 0}
                        icon={Users}
                        color="green"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Schedule */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                <div className="bg-blue-500 text-white w-12 h-12 rounded-lg flex items-center justify-center mr-3">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Grade 10 -Maths</p>
                                    <p className="text-sm text-gray-600">08:00 - 09:00 • Grade 10 Classroom</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                <div className="bg-blue-500 text-white w-12 h-12 rounded-lg flex items-center justify-center mr-3">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Grade 11 - Maths</p>
                                    <p className="text-sm text-gray-600">10:00 - 11:00 • Grade 11 Classroom</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Assignment submitted</p>
                                    <p className="text-xs text-gray-500">Kavitha Subhakaran - Maths Assignment 3</p>
                                    <p className="text-xs text-gray-400">2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">PTM request received</p>
                                    <p className="text-xs text-gray-500">Parent of Thivya Mahendran - Grade 11</p>
                                    <p className="text-xs text-gray-400">5 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard;
