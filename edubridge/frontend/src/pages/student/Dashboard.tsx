import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { studentAPI } from '../../services/api';
import { FileText, BookOpen, TrendingUp, Bell } from 'lucide-react';

const StudentDashboard = () => {
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
                    <p className="text-gray-600 mt-1">Your academic overview</p>
                </div>

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
                        title="Attendance"
                        value={`${stats.attendance || 0}%`}
                        icon={TrendingUp}
                        color="green"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Exams */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Exams</h3>
                        {stats.upcomingExams && stats.upcomingExams.length > 0 ? (
                            <div className="space-y-3">
                                {stats.upcomingExams.map((exam: any) => (
                                    <div key={exam.id} className="flex items-center p-3 bg-purple-50 rounded-lg">
                                        <div className="bg-purple-500 text-white w-12 h-12 rounded-lg flex items-center justify-center mr-3">
                                            <BookOpen size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{exam.title}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(exam.exam_date).toLocaleDateString()} • {exam.subject}
                                            </p>
                                        </div>
                                        <Badge status="pending">Assigned Exam</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No upcoming exams</p>
                        )}
                    </div>

                    {/* Pending Assignments */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Assignments</h3>
                        {stats.pendingAssignments && stats.pendingAssignments.length > 0 ? (
                            <div className="space-y-3">
                                {stats.pendingAssignments.slice(0, 3).map((assignment: any) => (
                                    <div key={assignment.id} className="flex items-center p-3 bg-orange-50 rounded-lg">
                                        <div className="bg-orange-500 text-white w-12 h-12 rounded-lg flex items-center justify-center mr-3">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{assignment.title}</p>
                                            <p className="text-sm text-gray-600">
                                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No pending assignments</p>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Bell size={20} className="mr-2" />
                            Notifications
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">New assignment posted in Maths</p>
                                    <p className="text-xs text-gray-500">2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Exam schedule updated for Science</p>
                                    <p className="text-xs text-gray-500">5 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Your assignment has been graded</p>
                                    <p className="text-xs text-gray-500">2 days ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
