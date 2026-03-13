import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import { adminAPI } from '../../services/api';
import {
    Users, GraduationCap, UserCheck, TrendingUp,
    Calendar, ClipboardList, Award, BookOpen, Megaphone, Clock,
    AlertCircle, BarChart2, ChevronRight,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashData {
    totalStudents?: number;
    totalTeachers?: number;
    totalParents?: number;
    averageAttendance?: number;
    pendingLeavesCount?: number;
    certificatesThisMonth?: number;
    recentAnnouncements?: { id: number; title: string; message: string; posted_at: string }[];
    upcomingExams?: { id: number; title: string; exam_date: string; subject_name: string; grade: string; section: string; duration_minutes: number }[];
    upcomingEvents?: { id: number; title: string; description: string; event_date: string }[];
    attendanceChartData?: { day: string; label: string; present: number; absent: number; late: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return m <= 1 ? 'just now' : `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [data, setData] = useState<DashData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartRange, setChartRange] = useState<'week' | 'month'>('week');
    const navigate = useNavigate();

    useEffect(() => {
        adminAPI.getDashboard()
            .then(res => setData(res.data))
            .catch(err => {
                console.error('Dashboard fetch error:', err);
                setError(err?.response?.data?.error || 'Failed to load dashboard data');
            })
            .finally(() => setLoading(false));
    }, []);

    // ── Loading ──
    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
            </div>
        </DashboardLayout>
    );

    // ── Error ──
    if (error) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-3">
                <AlertCircle size={40} />
                <p className="font-medium">{error}</p>
                <button
                    onClick={() => { setError(null); setLoading(true); adminAPI.getDashboard().then(r => setData(r.data)).catch(e => setError(e?.response?.data?.error || 'Error')).finally(() => setLoading(false)); }}
                    className="text-sm px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                    Retry
                </button>
            </div>
        </DashboardLayout>
    );

    // ── Chart data ──
    const allChart = data.attendanceChartData || [];
    const chartData = chartRange === 'week' ? allChart.slice(-7) : allChart;
    const totPres = chartData.reduce((s, d) => s + Number(d.present), 0);
    const totAll = chartData.reduce((s, d) => s + Number(d.present) + Number(d.absent) + Number(d.late), 0);
    const chartRate = totAll > 0 ? Math.round((totPres / totAll) * 100) : null;

    // Enrich with per-day attendance rate for the line overlay
    const chartDataEnriched = chartData.map(d => {
        const total = Number(d.present) + Number(d.absent) + Number(d.late);
        const rate = total > 0 ? Math.round((Number(d.present) / total) * 100) : 0;
        return { ...d, present: Number(d.present), absent: Number(d.absent), late: Number(d.late), rate };
    });

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">System overview and management</p>
                </div>

                {/* ── Row 1: Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Students" value={data.totalStudents ?? 0} icon={GraduationCap} color="blue" />
                    <StatCard title="Total Teachers" value={data.totalTeachers ?? 0} icon={Users} color="green" />
                    <StatCard title="Total Parents" value={data.totalParents ?? 0} icon={UserCheck} color="purple" />
                    <StatCard title="Avg Attendance" value={`${data.averageAttendance ?? 0}%`} icon={TrendingUp} color="orange" />
                </div>

                {/* ── Row 2: Pending Leaves + Certificates ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Pending Leaves */}
                    <div
                        onClick={() => navigate('/admin/leave')}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Pending Leaves</p>
                                <p className="text-4xl font-bold text-gray-800 mt-1">{data.pendingLeavesCount ?? 0}</p>
                                <p className="text-xs text-gray-400 mt-1">Awaiting admin approval</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${(data.pendingLeavesCount ?? 0) > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                <ClipboardList size={28} className={(data.pendingLeavesCount ?? 0) > 0 ? 'text-red-500' : 'text-gray-400'} />
                            </div>
                        </div>
                        {(data.pendingLeavesCount ?? 0) > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                                <AlertCircle size={12} /> Requires your attention
                            </div>
                        )}
                    </div>

                    {/* Certificates */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Certificates Issued</p>
                                <p className="text-4xl font-bold text-gray-800 mt-1">{data.certificatesThisMonth ?? 0}</p>
                                <p className="text-xs text-gray-400 mt-1">This month</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-yellow-50">
                                <Award size={28} className="text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Row 3: Attendance Chart ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <BarChart2 size={18} className="text-primary-500" /> Attendance Overview
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Stacked daily breakdown · attendance rate trend</p>
                        </div>
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 self-start">
                            {(['week', 'month'] as const).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setChartRange(r)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${chartRange === r ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {r === 'week' ? 'Last 7 days' : 'Last 30 days'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {chartDataEnriched.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <BarChart2 size={40} className="mb-3 opacity-25" />
                            <p className="text-sm">No attendance data for this period</p>
                        </div>
                    ) : (
                        <>
                            {/* 3 metric boxes */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="rounded-xl bg-indigo-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-indigo-700">{totPres}</p>
                                    <p className="text-xs text-indigo-500 font-medium mt-0.5">Present</p>
                                </div>
                                <div className="rounded-xl bg-red-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-red-500">{chartDataEnriched.reduce((s, d) => s + d.absent, 0)}</p>
                                    <p className="text-xs text-red-400 font-medium mt-0.5">Absent</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-amber-500">{chartDataEnriched.reduce((s, d) => s + d.late, 0)}</p>
                                    <p className="text-xs text-amber-500 font-medium mt-0.5">Late</p>
                                </div>
                            </div>

                            {/* Average */}
                            {chartRate !== null && (
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-bold text-gray-800">{chartRate}%</span>
                                    <span className="text-sm text-gray-400">average attendance rate</span>
                                </div>
                            )}

                            {/* Bar chart — Present / Absent / Late per day */}
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartDataEnriched} barCategoryGap="30%" barGap={3}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        axisLine={false} tickLine={false}
                                        interval={chartRange === 'month' ? 3 : 0}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        axisLine={false} tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '10px',
                                            border: 'none',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            fontSize: 12,
                                        }}
                                        cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                    />
                                    <Bar dataKey="present" name="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="late" name="Late" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </div>

                {/* ── Row 4: Announcements + Exams ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Recent Announcements */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Megaphone size={18} className="text-primary-500" /> Recent Announcements
                            </h3>
                            <button onClick={() => navigate('/admin/announcements')} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-0.5">
                                View all <ChevronRight size={12} />
                            </button>
                        </div>
                        {(data.recentAnnouncements?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {data.recentAnnouncements!.map(ann => (
                                    <div key={ann.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center mt-0.5">
                                            <Megaphone size={14} className="text-primary-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{ann.title}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{ann.message}</p>
                                            <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-1">
                                                <Clock size={10} /> {timeAgo(ann.posted_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <Megaphone size={32} className="mb-2 opacity-25" />
                                <p className="text-sm">No announcements yet</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Exams */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <BookOpen size={18} className="text-indigo-500" /> Upcoming Exams
                                <span className="text-xs text-gray-400 font-normal">(next 7 days)</span>
                            </h3>
                        </div>
                        {(data.upcomingExams?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {data.upcomingExams!.map(exam => (
                                    <div key={exam.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase leading-none">
                                                {new Date(exam.exam_date).toLocaleDateString('en-IN', { month: 'short' })}
                                            </span>
                                            <span className="text-sm font-bold text-indigo-700 leading-tight">
                                                {new Date(exam.exam_date).getDate()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{exam.title}</p>
                                            <p className="text-xs text-gray-500">{exam.subject_name} · {exam.grade}-{exam.section}</p>
                                        </div>
                                        <span className="text-xs text-indigo-500 font-medium whitespace-nowrap">{fmtDate(exam.exam_date)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <BookOpen size={32} className="mb-2 opacity-25" />
                                <p className="text-sm">No exams in the next 7 days</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Row 5: Events + Quick Actions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Upcoming Events */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Calendar size={18} className="text-emerald-500" /> Upcoming Events
                            </h3>
                            <button onClick={() => navigate('/admin/events')} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-0.5">
                                View all <ChevronRight size={12} />
                            </button>
                        </div>
                        {(data.upcomingEvents?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {data.upcomingEvents!.map(evt => (
                                    <div key={evt.id} className="border-l-4 border-emerald-400 pl-3 py-1.5 bg-emerald-50 rounded-r-lg">
                                        <p className="text-sm font-semibold text-gray-800">{evt.title}</p>
                                        {evt.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{evt.description}</p>}
                                        <p className="text-xs text-emerald-600 font-medium mt-1">{fmtDate(evt.event_date)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <Calendar size={32} className="mb-2 opacity-25" />
                                <p className="text-sm">No upcoming events</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            {[
                                { label: '+ Add New Student', path: '/admin/users' },
                                { label: '+ Add New Teacher', path: '/admin/users' },
                                { label: '+ Create Announcement', path: '/admin/announcements' },
                                { label: '+ Add Event', path: '/admin/events' },
                                { label: '+ Manage Leave Requests', path: '/admin/leave' },
                            ].map(a => (
                                <button
                                    key={a.label}
                                    onClick={() => navigate(a.path)}
                                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-primary-50 border border-transparent hover:border-primary-100 rounded-lg transition-colors text-gray-700 hover:text-primary-700 font-medium text-sm"
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
