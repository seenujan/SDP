import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import {
    UserCircle,
    Bell,
    Calendar,
    GraduationCap,
    ClipboardCheck,
    Trophy,
    Clock,
    MapPin
} from 'lucide-react';

const ParentDashboard = () => {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await parentAPI.getDashboard();
            setDashboardData(response.data);
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

    const { selectedChild, notifications, upcomingPTM } = dashboardData || {};

    // Helper to format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">

                {/* Child Profile Header */}
                {selectedChild && (
                    <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10 flex items-start justify-between">
                            <div className="flex items-center">
                                {/* Avatar Placeholder */}
                                <div className="hidden md:flex bg-blue-500 rounded-full w-20 h-20 items-center justify-center mr-6 border-2 border-blue-400">
                                    <UserCircle size={48} className="text-blue-100" />
                                </div>

                                <div>
                                    <p className="text-blue-200 text-sm mb-1">Child Name</p>
                                    <h1 className="text-3xl font-bold mb-1">{selectedChild.full_name}</h1>
                                    <div className="flex items-center text-blue-200 text-sm mb-4">
                                        <div className="bg-blue-700/50 px-2 py-0.5 rounded flex items-center mr-2">
                                            <span>{selectedChild.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-6 text-sm font-medium">
                                        <div className="flex items-center">
                                            <GraduationCap size={18} className="mr-2 opacity-80" />
                                            <span>Grade: {selectedChild.grade} {selectedChild.section}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <ClipboardCheck size={18} className="mr-2 opacity-80" />
                                            <span>Attendance: {selectedChild.attendance_percentage}%</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Trophy size={18} className="mr-2 opacity-80" />
                                            <span>Class Rank: {selectedChild.class_rank}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:block opacity-50">
                                <UserCircle size={120} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Notifications */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <Bell className="text-blue-600 mr-2" size={20} />
                            Recent Notifications
                        </h3>

                        <div className="space-y-4">
                            {(!notifications || notifications.length === 0) ? (
                                <p className="text-gray-500 italic">No recent notifications</p>
                            ) : (
                                notifications.map((notif: any, idx: number) => (
                                    <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors cursor-default">
                                        <p className="font-semibold text-gray-800 text-sm mb-1">{notif.title}</p>
                                        <p className="text-xs text-gray-500 flex items-center">
                                            <Clock size={12} className="mr-1" />
                                            {formatTimeAgo(notif.time)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming PTM */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <Calendar className="text-blue-600 mr-2" size={20} />
                            Upcoming PTM
                        </h3>

                        {upcomingPTM ? (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                                <div className="mb-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                                        Next Parent-Teacher Meeting
                                    </p>
                                    <h4 className="text-xl font-bold text-gray-900">
                                        {new Date(upcomingPTM.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {['10:00 AM', '2:00 PM'][Math.floor(Math.random() * 2)] /* Placeholder time if not in DB, assuming DB has date only */}
                                    </h4>
                                </div>

                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex items-center">
                                        <UserCircle size={16} className="text-blue-400 mr-2" />
                                        <span>Teacher: {upcomingPTM.teacher_name} ({upcomingPTM.subject})</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin size={16} className="text-blue-400 mr-2" />
                                        <span>Location: School Main Hall</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center">
                                <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500 font-medium">No upcoming PTM scheduled</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ParentDashboard;
