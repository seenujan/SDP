import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import { adminAPI } from '../../services/api';
import { DashboardStats } from '../../types';
import { Users, GraduationCap, UserCheck, TrendingUp, Calendar } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await adminAPI.getDashboard();
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
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">System overview and management</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents || 0}
                        icon={GraduationCap}
                        color="blue"
                    />
                    <StatCard
                        title="Total Teachers"
                        value={stats.totalTeachers || 0}
                        icon={Users}
                        color="green"
                    />
                    <StatCard
                        title="Total Parents"
                        value={stats.totalParents || 0}
                        icon={UserCheck}
                        color="purple"
                    />
                    <StatCard
                        title="Average Attendance"
                        value={`${stats.averageAttendance || 0}%`}
                        icon={TrendingUp}
                        color="orange"
                    />
                </div>

                {/* Upcoming Events */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Calendar className="mr-2" size={20} />
                            Upcoming Events
                        </h3>
                        {stats.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                            <div className="space-y-3">
                                {stats.upcomingEvents.map((event: any) => (
                                    <div key={event.id} className="border-l-4 border-primary-500 pl-4 py-2">
                                        <p className="font-semibold text-gray-800">{event.title}</p>
                                        <p className="text-sm text-gray-600">{event.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(event.event_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No upcoming events</p>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            <button className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-primary-700 font-medium">
                                + Add New Student
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-primary-700 font-medium">
                                + Add New Teacher
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-primary-700 font-medium">
                                + Create Announcement
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
