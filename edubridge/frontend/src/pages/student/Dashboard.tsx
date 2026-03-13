import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { studentAPI } from '../../services/api';
import { FileText, BookOpen, TrendingUp, Bell, Clock, Calendar, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await studentAPI.getDashboard();
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
                    <p className="text-gray-500 font-medium">Loading your dashboard...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {user ? `Welcome, ${user.full_name.split(' ')[0]}!` : 'Student Dashboard'}
                    </h1>
                    <p className="text-gray-600 mt-1">Here's what's happening today in your academic journey.</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Pending Assignments"
                        value={stats.pendingAssignments?.length || 0}
                        icon={FileText}
                        color="orange"
                    />
                    <StatCard
                        title="Upcoming Exams"
                        value={stats.upcomingExams?.length || 0}
                        icon={BookOpen}
                        color="purple"
                    />
                    <StatCard
                        title="Average Attendance"
                        value={`${stats.attendance || 0}%`}
                        icon={TrendingUp}
                        color="green"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Schedule & Activity */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Today's Schedule */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Clock size={20} className="mr-2 text-primary-600" />
                                    Today's Schedule
                                </h3>
                                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>
                            <div className="p-6">
                                {stats.todaysSchedule && stats.todaysSchedule.length > 0 ? (
                                    <div className="space-y-4">
                                        {stats.todaysSchedule.map((slot: any, idx: number) => (
                                            <div key={idx} className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                                                <div className="mr-4 text-center min-w-[80px]">
                                                    <p className="text-sm font-bold text-gray-800">{slot.start_time}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase">{slot.end_time}</p>
                                                </div>
                                                <div className="w-1 h-10 bg-primary-500 rounded-full mr-4"></div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800 text-base">{slot.subject}</h4>
                                                    <p className="text-xs text-gray-500 italic">Prof. {slot.teacher_name || 'TBA'}</p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <Badge status="active">Active</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                                        <p className="text-gray-500">No classes scheduled for today.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Assessments Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Exams */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center uppercase tracking-tight">
                                    <BookOpen size={18} className="mr-2 text-purple-600" />
                                    Upcoming Exams
                                </h3>
                                {stats.upcomingExams && stats.upcomingExams.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.upcomingExams.map((exam: any) => (
                                            <div key={exam.id} className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                                                <p className="font-bold text-gray-800 text-sm">{exam.title}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-purple-700">{exam.subject}</p>
                                                    <p className="text-[10px] font-semibold text-gray-500">{new Date(exam.exam_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No upcoming exams.</p>
                                )}
                            </div>

                            {/* Assignments */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center uppercase tracking-tight">
                                    <FileText size={18} className="mr-2 text-orange-600" />
                                    Assignments Due
                                </h3>
                                {stats.pendingAssignments && stats.pendingAssignments.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.pendingAssignments.slice(0, 3).map((assignment: any) => (
                                            <div key={assignment.id} className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                                                <p className="font-bold text-gray-800 text-sm truncate">{assignment.title}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-xs text-orange-700">{assignment.subject}</p>
                                                    <p className="text-[10px] font-semibold text-red-500">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">All caught up!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Activity Feed */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Bell size={20} className="mr-2 text-primary-600" />
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="p-6 flex-grow">
                                {stats.recentActivities && stats.recentActivities.length > 0 ? (
                                    <div className="space-y-6">
                                        {stats.recentActivities.map((activity: any, idx: number) => (
                                            <div key={idx} className="relative pl-6 border-l-2 border-primary-100 pb-2">
                                                <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border-2 border-primary-500">
                                                    <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                                                </div>
                                                <div className="mb-1 flex justify-between items-start">
                                                    <p className="text-[11px] font-bold text-primary-600 uppercase tracking-wider">{activity.message}</p>
                                                    <span className="text-[10px] text-gray-400">{new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-sm text-gray-800 font-medium">{activity.detail}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{new Date(activity.time).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CheckCircle className="mx-auto text-gray-200 mb-2" size={48} />
                                        <p className="text-gray-400 text-sm px-4">No recent activities to show. Stay active to see updates here!</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                                <button className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-widest">
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
