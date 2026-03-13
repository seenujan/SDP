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
    const [switching, setSwitching] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

    useEffect(() => {
        fetchDashboard();
    }, [selectedChildId]);

    const fetchDashboard = async () => {
        if (!selectedChildId) setLoading(true);
        else setSwitching(true);

        try {
            const response = await parentAPI.getDashboard(selectedChildId || undefined);
            setDashboardData(response.data);
            if (!selectedChildId && response.data.selectedChild) {
                setSelectedChildId(response.data.selectedChild.id);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
            setSwitching(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500">Initializing Dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const { selectedChild, children, notifications, upcomingPTM } = dashboardData || {};

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
            <div className={`animate-fade-in space-y-6 ${switching ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>

                {/* Header with Child Selection */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
                        <p className="text-gray-500 text-sm">Welcome back! Here's an overview of your children's progress.</p>
                    </div>

                    {children && children.length > 1 && (
                        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Switch Child:</span>
                            <select
                                value={selectedChildId || ''}
                                onChange={(e) => setSelectedChildId(Number(e.target.value))}
                                className="bg-gray-50 border-none text-gray-900 text-sm rounded-lg focus:ring-blue-500 block p-2 pr-8 font-semibold cursor-pointer outline-none"
                            >
                                {children.map((child: any) => (
                                    <option key={child.id} value={child.id}>
                                        {child.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Child Profile Header */}
                {selectedChild && (
                    <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>

                        <div className="relative z-10 flex items-start justify-between">
                            <div className="flex items-center">
                                {/* Avatar Placeholder */}
                                <div className="hidden md:flex bg-blue-500/50 backdrop-blur-md rounded-full w-20 h-20 items-center justify-center mr-6 border-2 border-white/20 shadow-inner">
                                    <UserCircle size={48} className="text-blue-100" />
                                </div>

                                <div>
                                    <p className="text-blue-200 text-sm mb-1 uppercase tracking-wider font-semibold">Student Summary</p>
                                    <h1 className="text-3xl font-bold mb-1">{selectedChild.full_name}</h1>
                                    <div className="flex items-center text-blue-200 text-sm mb-4">
                                        <div className="bg-blue-700/50 px-2 py-0.5 rounded flex items-center mr-2">
                                            <span>Roll No: {selectedChild.roll_number}</span>
                                        </div>
                                        {selectedChild.section && (
                                            <div className="bg-blue-700/50 px-2 py-0.5 rounded flex items-center">
                                                <span>{selectedChild.grade} - {selectedChild.section}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-6 text-sm font-medium">
                                        <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                            <ClipboardCheck size={18} className="mr-2 text-blue-200" />
                                            <span>Attendance: <span className="text-white font-bold">{selectedChild.attendance_percentage}%</span></span>
                                        </div>
                                        <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                            <Trophy size={18} className="mr-2 text-yellow-300" />
                                            <span>Term 1 Rank: <span className="text-white font-bold">{selectedChild.class_rank}</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:block opacity-20 transform rotate-12">
                                <GraduationCap size={140} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Notifications */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <Bell className="text-blue-600 mr-2" size={20} />
                            Recent Activities
                        </h3>

                        <div className="space-y-4 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {(!notifications || notifications.length === 0) ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                                    <Bell size={40} className="text-gray-200 mb-2" />
                                    <p className="text-gray-500 italic text-sm">No recent activities for {selectedChild?.full_name?.split(' ')[0]}</p>
                                </div>
                            ) : (
                                notifications.map((notif: any, idx: number) => (
                                    <div key={idx} className="border border-gray-50 rounded-lg p-4 bg-gray-50/50 hover:bg-white transition-all duration-200 cursor-default flex items-center space-x-4 border-l-4 border-l-blue-500">
                                        <div className={`p-2.5 rounded-xl ${notif.type === 'grade' ? 'bg-green-100 text-green-600' :
                                            notif.type === 'exam' ? 'bg-blue-100 text-blue-600' :
                                                'bg-orange-100 text-orange-600'
                                            }`}>
                                            {notif.type === 'grade' ? <Trophy size={16} /> : <Bell size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 text-sm mb-0.5">{notif.title}</p>
                                            <p className="text-[10px] text-gray-400 flex items-center uppercase font-bold tracking-tight">
                                                <Clock size={10} className="mr-1" />
                                                {formatTimeAgo(notif.time)}
                                            </p>
                                        </div>
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
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-inner">
                                <div className="mb-6">
                                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2 opacity-70">
                                        Next Parent-Teacher Meeting
                                    </p>
                                    <h4 className="text-3xl font-black text-gray-900 leading-tight">
                                        {new Date(upcomingPTM.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </h4>
                                    <div className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold mt-2 shadow-sm">
                                        <Clock size={12} className="mr-1.5" />
                                        {upcomingPTM.meeting_time}
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm text-gray-700">
                                    <div className="flex items-center bg-white/50 p-3 rounded-lg">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                                            <UserCircle size={22} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Teacher</p>
                                            <p className="font-bold text-gray-900">{upcomingPTM.teacher_name}</p>
                                            <p className="text-xs text-blue-600 font-medium">{upcomingPTM.subject || 'Class Teacher'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-white/50 p-3 rounded-lg">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                                            <MapPin size={22} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Location</p>
                                            <p className="font-bold text-gray-900">Virtual Meeting / School Office</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50/50 border border-gray-100 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center h-[300px]">
                                <div className="bg-white p-5 rounded-3xl shadow-sm mb-4 border border-gray-100">
                                    <Calendar size={48} className="text-gray-300" />
                                </div>
                                <p className="text-gray-800 font-bold">No upcoming PTM</p>
                                <p className="text-xs text-gray-400 mt-2 max-w-[200px]">You will be notified once a meeting is scheduled with {selectedChild?.full_name?.split(' ')[0]}'s teachers.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ParentDashboard;

