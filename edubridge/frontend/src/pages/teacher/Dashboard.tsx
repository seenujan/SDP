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
                    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
                        <div className="space-y-3">
                            {stats.todaysSchedule && stats.todaysSchedule.length > 0 ? (
                                stats.todaysSchedule.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                        <div className="bg-blue-500 text-white w-12 h-12 rounded-lg flex items-center justify-center mr-3 shrink-0">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.grade} {item.section} - {item.subject}</p>
                                            <p className="text-sm text-gray-600">
                                                {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)} • {item.grade} Classroom
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                    <BookOpen size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">No classes scheduled for today.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
                        <div className="space-y-4">
                            {stats.recentActivities && stats.recentActivities.length > 0 ? (
                                stats.recentActivities.map((activity: any, index: number) => (
                                    <div key={index} className="flex items-start">
                                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 shrink-0 ${activity.type === 'submission' ? 'bg-blue-500' :
                                                activity.type === 'ptm' ? 'bg-orange-500' : 'bg-green-500'
                                            }`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 leading-tight">{activity.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{activity.detail}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(activity.time).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                    <ClipboardList size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">No recent activities.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard;
