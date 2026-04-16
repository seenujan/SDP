import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
    Download, Filter, FileText, Calendar, Users, Award, MessageSquare,
    BarChart3, AlertTriangle, CheckCircle, TrendingUp, Target,
    Banknote, UserCheck, Star,
} from 'lucide-react';

type TabId = 'attendance' | 'exam' | 'certificate' | 'scholarship' | 'user' | 'ptm';

// ─── Colour Palettes ──────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
    student: '#6366f1',
    teacher: '#22c55e',
    parent: '#f59e0b',
    admin: '#ec4899',
};
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#f87171'];
const attColor = (pct: number) => pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
const attBadge = (pct: number) => {
    if (pct >= 80) return 'bg-green-100 text-green-800';
    if (pct >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

// ─── Shared UI Helpers ────────────────────────────────────────────────────────
const KpiCard = ({
    label, value, sub, icon: Icon, color,
}: { label: string; value: string | number; sub?: string; icon: any; color: string }) => (
    <div className={`rounded-2xl p-5 flex items-center gap-4 shadow-sm border ${color}`}>
        <div className="p-3 rounded-xl bg-white/60">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
            {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const InsightBanner = ({
    type, message,
}: { type: 'warning' | 'success' | 'info'; message: string }) => {
    const styles = {
        warning: 'bg-amber-50 border-amber-300 text-amber-800',
        success: 'bg-green-50 border-green-300 text-green-800',
        info: 'bg-blue-50 border-blue-300 text-blue-800',
    };
    const icons = {
        warning: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
        success: <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />,
        info: <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />,
    };
    return (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`}>
            {icons[type]}<span>{message}</span>
        </div>
    );
};

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm min-w-[130px]">
            <p className="font-bold text-gray-700 mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color || p.fill }} className="font-medium">
                    {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                </p>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Analytics Components per Tab
// ═══════════════════════════════════════════════════════════════════════════════

/* ─── Attendance ─────────────────────────────────────────────────────────────── */
const AttendanceAnalytics = ({ data }: { data: any[] }) => {
    const avg = data.reduce((s, r) => s + parseFloat(r.attendance_percentage || 0), 0) / data.length;
    const atRisk = data.filter(r => parseFloat(r.attendance_percentage) < 80).length;
    const totalPresent = data.reduce((s, r) => s + Number(r.present_days || 0), 0);
    const totalAbsent = data.reduce((s, r) => s + Number(r.absent_days || 0), 0);
    const totalLate = data.reduce((s, r) => s + Number(r.late_days || 0), 0);

    const buckets = [
        { range: '90–100%', count: data.filter(r => parseFloat(r.attendance_percentage) >= 90).length, fill: '#22c55e' },
        { range: '80–89%', count: data.filter(r => { const p = parseFloat(r.attendance_percentage); return p >= 80 && p < 90; }).length, fill: '#86efac' },
        { range: '60–79%', count: data.filter(r => { const p = parseFloat(r.attendance_percentage); return p >= 60 && p < 80; }).length, fill: '#f59e0b' },
        { range: 'Below 60%', count: data.filter(r => parseFloat(r.attendance_percentage) < 60).length, fill: '#ef4444' },
    ];

    const pieData = [
        { name: 'Present', value: totalPresent },
        { name: 'Absent', value: totalAbsent },
        { name: 'Late', value: totalLate },
    ].filter(d => d.value > 0);

    const studentBars = [...data]
        .sort((a, b) => parseFloat(a.attendance_percentage) - parseFloat(b.attendance_percentage))
        .slice(0, 20)
        .map(r => ({
            name: r.full_name?.split(' ')[0] || r.roll_number,
            pct: parseFloat(r.attendance_percentage),
            fill: attColor(parseFloat(r.attendance_percentage)),
        }));

    const riskStudents = data
        .filter(r => parseFloat(r.attendance_percentage) < 80)
        .sort((a, b) => parseFloat(a.attendance_percentage) - parseFloat(b.attendance_percentage))
        .slice(0, 5);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Average Attendance" value={`${avg.toFixed(1)}%`} sub="across all students" icon={TrendingUp}
                    color={avg >= 80 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'} />
                <KpiCard label="At-Risk Students" value={atRisk} sub="below 80%" icon={AlertTriangle}
                    color={atRisk > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} />
                <KpiCard label="Total Students" value={data.length} sub="in scope" icon={Users}
                    color="bg-blue-50 border-blue-200 text-blue-700" />
            </div>

            {atRisk > 0
                ? <InsightBanner type="warning" message={`⚠️ ${atRisk} student${atRisk > 1 ? 's are' : ' is'} at risk (below 80%). Immediate follow-up recommended.`} />
                : <InsightBanner type="success" message="✅ All students maintain attendance above 80%." />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Attendance Distribution by Range</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={buckets} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                                {buckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Total Days Breakdown</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {studentBars.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-1">Student Attendance %
                        <span className="text-gray-400 font-normal ml-2">(sorted ascending — bottom 20)</span>
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={studentBars} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Bar dataKey="pct" name="Attendance" radius={[5, 5, 0, 0]}>
                                {studentBars.map((b, i) => <Cell key={i} fill={b.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {riskStudents.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Top 5 Most At-Risk Students
                    </h3>
                    <div className="space-y-2">
                        {riskStudents.map((s, i) => (
                            <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm">
                                <div>
                                    <span className="text-sm font-semibold text-gray-800">{s.full_name}</span>
                                    <span className="text-xs text-gray-500 ml-2">#{s.roll_number} · {s.grade}-{s.section}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${attBadge(parseFloat(s.attendance_percentage))}`}>
                                    {parseFloat(s.attendance_percentage).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Exam ───────────────────────────────────────────────────────────────────── */
const ExamAnalytics = ({ data }: { data: any[] }) => {
    const validScore = data.filter(r => r.average_score !== null && r.average_score !== undefined);
    const avgScore = validScore.length
        ? validScore.reduce((s, r) => s + parseFloat(r.average_score), 0) / validScore.length : 0;
    const totalSubmissions = data.reduce((s, r) => s + parseInt(r.submitted_count || 0), 0);
    const totalSlots = data.reduce((s, r) => s + parseInt(r.total_students || 0), 0);
    const subRate = totalSlots > 0 ? (totalSubmissions / totalSlots) * 100 : 0;

    const barData = data.map(r => ({
        name: r.exam_title?.length > 14 ? r.exam_title.substring(0, 14) + '…' : r.exam_title,
        fullName: r.exam_title,
        avg: r.average_score !== null ? parseFloat(parseFloat(r.average_score).toFixed(1)) : 0,
        highest: r.highest_score !== null ? parseFloat(parseFloat(r.highest_score).toFixed(1)) : 0,
        lowest: r.lowest_score !== null ? parseFloat(parseFloat(r.lowest_score).toFixed(1)) : 0,
        submitted: parseInt(r.submitted_count || 0),
        total: parseInt(r.total_students || 0),
        grade: r.grade, section: r.section,
    }));

    const submissionData = data.map(r => {
        const total = parseInt(r.total_students || 0);
        const submitted = parseInt(r.submitted_count || 0);
        return {
            name: r.exam_title?.length > 14 ? r.exam_title.substring(0, 14) + '…' : r.exam_title,
            rate: total > 0 ? Math.round((submitted / total) * 100) : 0,
        };
    });

    const lowPerforming = data.filter(r => r.average_score !== null && parseFloat(r.average_score) < 50);
    const lowSub = data.filter(r => { const t = parseInt(r.total_students || 0); const s = parseInt(r.submitted_count || 0); return t > 0 && (s / t) < 0.7; });

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Exams" value={data.length} sub="in selected scope" icon={FileText}
                    color="bg-indigo-50 border-indigo-200 text-indigo-700" />
                <KpiCard label="Overall Avg Score" value={avgScore > 0 ? avgScore.toFixed(1) : '—'} sub="across all exams" icon={Target}
                    color={avgScore >= 60 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'} />
                <KpiCard label="Submission Rate" value={subRate > 0 ? `${subRate.toFixed(0)}%` : '—'} sub={`${totalSubmissions}/${totalSlots} submitted`} icon={CheckCircle}
                    color={subRate >= 70 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} />
            </div>

            {lowPerforming.length > 0 && <InsightBanner type="warning" message={`⚠️ ${lowPerforming.length} exam${lowPerforming.length > 1 ? 's have' : ' has'} avg score below 50 — review those topics.`} />}
            {lowSub.length > 0 && <InsightBanner type="warning" message={`📋 ${lowSub.length} exam${lowSub.length > 1 ? 's have' : ' has'} submission rate below 70%.`} />}
            {lowPerforming.length === 0 && lowSub.length === 0 && <InsightBanner type="success" message="✅ All exams show good scores and healthy submission rates!" />}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Score Analysis Per Exam (Avg / Highest / Lowest)</h3>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} barCategoryGap="25%" barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="avg" name="Avg Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="highest" name="Highest" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="lowest" name="Lowest" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Submission Rate Per Exam (%)</h3>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={submissionData} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                        <Bar dataKey="rate" name="Submission Rate" radius={[5, 5, 0, 0]}>
                            {submissionData.map((d, i) => <Cell key={i} fill={d.rate >= 70 ? '#6366f1' : '#f87171'} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {barData.map((exam, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{exam.grade}-{exam.section}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate mb-3">{exam.fullName}</p>
                        <div className="flex justify-between text-center text-xs">
                            <div><p className="text-lg font-bold text-green-600">{exam.highest || '—'}</p><p className="text-gray-400">Highest</p></div>
                            <div><p className="text-lg font-bold text-indigo-600">{exam.avg || '—'}</p><p className="text-gray-400">Avg</p></div>
                            <div><p className="text-lg font-bold text-red-500">{exam.lowest || '—'}</p><p className="text-gray-400">Lowest</p></div>
                            <div><p className="text-lg font-bold text-gray-700">{exam.submitted}/{exam.total}</p><p className="text-gray-400">Submitted</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─── Certificate ────────────────────────────────────────────────────────────── */
const CertificateAnalytics = ({ data }: { data: any[] }) => {
    // Count by type
    const typeMap: Record<string, number> = {};
    data.forEach(r => { typeMap[r.certificate_type] = (typeMap[r.certificate_type] || 0) + 1; });
    const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    const topType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // By month line chart
    const monthMap: Record<string, number> = {};
    data.forEach(r => {
        const month = r.issue_date?.substring(0, 7) || 'Unknown';
        monthMap[month] = (monthMap[month] || 0) + 1;
    });
    const lineData = Object.entries(monthMap).sort().map(([month, count]) => ({ month, count }));

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Issued" value={data.length} sub="certificates in scope" icon={Award}
                    color="bg-yellow-50 border-yellow-200 text-yellow-700" />
                <KpiCard label="Most Common Type" value={topType} sub={`${typeMap[topType] || 0} issued`} icon={Star}
                    color="bg-purple-50 border-purple-200 text-purple-700" />
                <KpiCard label="Unique Types" value={Object.keys(typeMap).length} sub="certificate categories" icon={FileText}
                    color="bg-blue-50 border-blue-200 text-blue-700" />
            </div>

            <InsightBanner type="info" message={`📜 ${data.length} certificates issued. Most popular: "${topType}" with ${typeMap[topType] || 0} records.`} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Certificates by Type</h3>
                    <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Certificates Issued Per Month</h3>
                    <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Line type="monotone" dataKey="count" name="Certificates" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

/* ─── Scholarship ────────────────────────────────────────────────────────────── */
const ScholarshipAnalytics = ({ data }: { data: any[] }) => {
    const totalAmount = data.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const gradeMap: Record<string, number> = {};
    data.forEach(r => {
        const gKey = String(r.grade).toLowerCase().startsWith('grade') ? String(r.grade) : `Grade ${r.grade}`;
        gradeMap[gKey] = (gradeMap[gKey] || 0) + 1;
    });
    const gradeData = Object.entries(gradeMap).sort().map(([grade, count]) => ({ grade, count }));

    const barData = data.slice(0, 15).map(r => ({
        name: r.student_name?.split(' ')[0] || r.student_name,
        fullName: r.student_name,
        amount: parseFloat(r.amount || 0),
        grade: r.grade, section: r.section,
    }));

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Amount Awarded" value={`Rs. ${totalAmount.toLocaleString('en-IN')}`} sub="cumulative scholarships" icon={Banknote}
                    color="bg-green-50 border-green-200 text-green-700" />
                <KpiCard label="Recipients" value={data.length} sub="students awarded" icon={Users}
                    color="bg-blue-50 border-blue-200 text-blue-700" />
                <KpiCard label="Avg Per Student" value={data.length > 0 ? `Rs. ${(totalAmount / data.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'} sub="average scholarship" icon={Target}
                    color="bg-indigo-50 border-indigo-200 text-indigo-700" />
            </div>

            <InsightBanner type="info" message={`🏅 Rs. ${totalAmount.toLocaleString('en-IN')} in scholarships distributed to ${data.length} students across ${Object.keys(gradeMap).length} grades.`} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Scholarship Amount per Student (Top 15)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Bar dataKey="amount" name="Amount (Rs.)" fill="#6366f1" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Recipients by Grade</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={gradeData} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Bar dataKey="count" name="Students" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

/* ─── User ───────────────────────────────────────────────────────────────────── */
const UserAnalytics = ({ data }: { data: any[] }) => {
    const roleMap: Record<string, { active: number; inactive: number }> = {};
    data.forEach(r => {
        if (!roleMap[r.role]) roleMap[r.role] = { active: 0, inactive: 0 };
        if (r.status === 'Active') roleMap[r.role].active++;
        else roleMap[r.role].inactive++;
    });

    const pieData = Object.entries(roleMap).map(([role, counts]) => ({
        name: role.charAt(0).toUpperCase() + role.slice(1),
        value: counts.active + counts.inactive,
        color: ROLE_COLORS[role] || '#6b7280',
    }));

    const stackedData = Object.entries(roleMap).map(([role, counts]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        Active: counts.active,
        Inactive: counts.inactive,
    }));

    const totalActive = data.filter(r => r.status === 'Active').length;
    const activeRate = data.length > 0 ? (totalActive / data.length) * 100 : 0;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Users" value={data.length} sub="in selected scope" icon={Users}
                    color="bg-blue-50 border-blue-200 text-blue-700" />
                <KpiCard label="Active Users" value={totalActive} sub={`${activeRate.toFixed(0)}% of total`} icon={UserCheck}
                    color="bg-green-50 border-green-200 text-green-700" />
                <KpiCard label="Inactive Users" value={data.length - totalActive} sub="requires attention" icon={AlertTriangle}
                    color={(data.length - totalActive) > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'} />
            </div>

            <InsightBanner type={activeRate >= 90 ? 'success' : activeRate >= 70 ? 'info' : 'warning'}
                message={activeRate >= 90 ? `✅ ${activeRate.toFixed(0)}% of users are active — excellent engagement.`
                    : `📊 ${activeRate.toFixed(0)}% active users. ${data.length - totalActive} users are inactive and may need follow-up.`} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">User Distribution by Role</h3>
                    <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Active vs Inactive by Role</h3>
                    <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={stackedData} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="role" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Active" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Inactive" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

/* ─── PTM Feedback ───────────────────────────────────────────────────────────── */
const PTMAnalytics = ({ data }: { data: any[] }) => {
    const parentFeedback = data.filter(r => r.feedback_from === 'parent');
    const teacherFeedback = data.filter(r => r.feedback_from === 'teacher');

    const pieData = [
        { name: 'Parent Feedback', value: parentFeedback.length },
        { name: 'Teacher Feedback', value: teacherFeedback.length },
    ].filter(d => d.value > 0);

    // Teacher counts per PTM
    const teacherMap: Record<string, number> = {};
    data.forEach(r => { teacherMap[r.teacher_name] = (teacherMap[r.teacher_name] || 0) + 1; });
    const teacherData = Object.entries(teacherMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({
        name: name?.split(' ')[0] || name,
        fullName: name,
        count,
    }));

    // Feedback per month
    const monthMap: Record<string, number> = {};
    data.forEach(r => {
        const month = r.meeting_date?.substring(0, 7) || 'Unknown';
        monthMap[month] = (monthMap[month] || 0) + 1;
    });
    const lineData = Object.entries(monthMap).sort().map(([month, count]) => ({ month, count }));

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Feedback" value={data.length} sub="entries recorded" icon={MessageSquare}
                    color="bg-purple-50 border-purple-200 text-purple-700" />
                <KpiCard label="Parent Responses" value={parentFeedback.length} sub={data.length > 0 ? `${((parentFeedback.length / data.length) * 100).toFixed(0)}% of total` : '—'} icon={Users}
                    color="bg-blue-50 border-blue-200 text-blue-700" />
                <KpiCard label="Teacher Responses" value={teacherFeedback.length} sub={data.length > 0 ? `${((teacherFeedback.length / data.length) * 100).toFixed(0)}% of total` : '—'} icon={UserCheck}
                    color="bg-green-50 border-green-200 text-green-700" />
            </div>

            <InsightBanner type="info"
                message={`💬 ${data.length} total feedback entries from ${Object.keys(teacherMap).length} teachers. Parent response rate: ${data.length > 0 ? ((parentFeedback.length / data.length) * 100).toFixed(0) : 0}%.`} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Feedback Source Breakdown</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Feedback Per Month</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Line type="monotone" dataKey="count" name="Feedback" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {teacherData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Feedback Count by Teacher (Top 8)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={teacherData} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Bar dataKey="count" name="Feedback Entries" fill="#a78bfa" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Admin Reports Component
// ═══════════════════════════════════════════════════════════════════════════════
const AdminReports = () => {
    const [activeTab, setActiveTab] = useState<TabId>('attendance');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [showTable, setShowTable] = useState(false);

    // Metadata
    const [grades, setGrades] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [certificateTypes, setCertificateTypes] = useState<any[]>([]);
    const [allExams, setAllExams] = useState<any[]>([]);

    // Filters
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedCertTypeId, setSelectedCertTypeId] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => { fetchMetadata(); }, []);
    useEffect(() => { setReportData([]); setShowTable(false); }, [activeTab]);

    const fetchMetadata = async () => {
        try {
            const [gradesRes, classesRes, examsRes] = await Promise.all([adminAPI.getGrades(), adminAPI.getClasses(), adminAPI.getExams()]);
            setGrades(gradesRes.data);
            setClasses(classesRes.data);
            setAllExams(examsRes.data);
            try {
                const certTypesRes = await adminAPI.getCertificateTypes();
                setCertificateTypes(certTypesRes.data);
            } catch (e) { console.error('Cert types fetch failed', e); }
        } catch (error) { console.error('Failed to fetch metadata:', error); }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setShowTable(false);
        try {
            let response;
            switch (activeTab) {
                case 'attendance': response = await adminAPI.getAttendanceReport(selectedClassId, startDate, endDate); break;
                case 'exam': response = await adminAPI.getExamReport(selectedGrade, selectedExamId); break;
                case 'certificate': response = await adminAPI.getCertificateReport(selectedCertTypeId, startDate, endDate); break;
                case 'scholarship': response = await adminAPI.getScholarshipReport(startDate, endDate); break;
                case 'user': response = await adminAPI.getUserReport(selectedRole, selectedStatus); break;
                case 'ptm': response = await adminAPI.getPTMFeedbackReport(startDate, endDate); break;
            }
            setReportData(response?.data || []);
        } catch (error) { console.error('Failed to generate report:', error); }
        finally { setLoading(false); }
    };

    const handleExport = () => {
        if (reportData.length === 0) return;
        const headers = Object.keys(reportData[0]).join(',');
        const rows = reportData.map(row => Object.values(row).map(val => `"${val ?? ''}"`).join(',')).join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (reportData.length === 0) return;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const tabLabels: Record<string, string> = {
            attendance: 'Attendance Analytics Report',
            exam: 'Exam Performance Report',
            certificate: 'Certificate Issuance Report',
            scholarship: 'Scholarship Report',
            user: 'User Account Report',
            ptm: 'PTM Feedback Report',
        };

        // Header
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text(tabLabels[activeTab] || 'Analytics Report', 14, 12);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${dateStr}  |  EduBridge School Management System`, 14, 21);
        doc.setTextColor(0, 0, 0);
        let y = 36;

        const addSectionTitle = (title: string) => {
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
            doc.text(title, 14, y); y += 6;
        };

        const tableOpts = (head: string[][], body: any[][]) => ({
            head, body,
            styles: { fontSize: 8.5, cellPadding: 2.5 },
            headStyles: { fillColor: [79, 70, 229] as [number, number, number], textColor: 255, fontStyle: 'bold' as const },
            alternateRowStyles: { fillColor: [245, 247, 255] as [number, number, number] },
            margin: { left: 14, right: 14 },
        });

        if (activeTab === 'attendance') {
            const avg = reportData.reduce((s: number, r: any) => s + parseFloat(r.attendance_percentage || 0), 0) / reportData.length;
            const atRisk = reportData.filter((r: any) => parseFloat(r.attendance_percentage) < 80).length;
            const totalPresent = reportData.reduce((s: number, r: any) => s + Number(r.present_days || 0), 0);
            const totalAbsent = reportData.reduce((s: number, r: any) => s + Number(r.absent_days || 0), 0);
            const totalLate = reportData.reduce((s: number, r: any) => s + Number(r.late_days || 0), 0);

            addSectionTitle('Summary Metrics');
            autoTable(doc, { startY: y, ...tableOpts([['Metric', 'Value', 'Status']], [
                ['Average Attendance', `${avg.toFixed(1)}%`, avg >= 80 ? '[OK] Good' : '[!] Needs Attention'],
                ['At-Risk Students (<80%)', `${atRisk}`, atRisk > 0 ? '[!] Action Required' : '[OK] None'],
                ['Total Students', `${reportData.length}`, '—'],
                ['Total Present Days', `${totalPresent}`, '—'],
                ['Total Absent Days', `${totalAbsent}`, totalAbsent > totalPresent * 0.2 ? '[!] High' : '[OK] Acceptable'],
                ['Total Late Days', `${totalLate}`, '—'],
            ]) }); y = (doc as any).lastAutoTable.finalY + 10;

            // ─ Visual: Stacked attendance composition bar
            const totalAll = totalPresent + totalAbsent + totalLate;
            if (totalAll > 0) {
                doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                doc.text('Attendance Composition', 14, y); y += 7;
                const segBarW = pageW - 28; const segH = 14;
                const pW = (totalPresent / totalAll) * segBarW;
                const lW = (totalLate / totalAll) * segBarW;
                const aW = (totalAbsent / totalAll) * segBarW;
                doc.setFillColor(34, 197, 94);  doc.rect(14, y, pW, segH, 'F');
                doc.setFillColor(251, 191, 36); doc.rect(14 + pW, y, lW, segH, 'F');
                doc.setFillColor(248, 113, 113); doc.rect(14 + pW + lW, y, aW, segH, 'F');
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
                if (pW > 20) doc.text(`${((totalPresent/totalAll)*100).toFixed(0)}%`, 14 + pW/2, y + 9, { align: 'center' });
                if (lW > 20) doc.text(`${((totalLate/totalAll)*100).toFixed(0)}%`, 14 + pW + lW/2, y + 9, { align: 'center' });
                if (aW > 20) doc.text(`${((totalAbsent/totalAll)*100).toFixed(0)}%`, 14 + pW + lW + aW/2, y + 9, { align: 'center' });
                y += segH + 5;
                [
                    { label: `Present: ${totalPresent}`, color: [34, 197, 94] as [number,number,number], x: 14 },
                    { label: `Late: ${totalLate}`, color: [251, 191, 36] as [number,number,number], x: 80 },
                    { label: `Absent: ${totalAbsent}`, color: [248, 113, 113] as [number,number,number], x: 130 },
                ].forEach(({ label, color, x }) => {
                    doc.setFillColor(...color); doc.rect(x, y, 6, 5, 'F');
                    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                    doc.text(label, x + 8, y + 4.5);
                });
                y += 12;
            }

            // ─ Visual: Distribution horizontal bar chart
            doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
            doc.text('Attendance Distribution Chart', 14, y); y += 8;
            const distR: { label: string; count: number; color: [number,number,number]; cat: string }[] = [
                { label: '90-100%',   count: reportData.filter((r: any) => parseFloat(r.attendance_percentage) >= 90).length, color: [34, 197, 94],   cat: 'Excellent' },
                { label: '80-89%',   count: reportData.filter((r: any) => { const p = parseFloat(r.attendance_percentage); return p >= 80 && p < 90; }).length, color: [134, 239, 172], cat: 'Good' },
                { label: '60-79%',   count: reportData.filter((r: any) => { const p = parseFloat(r.attendance_percentage); return p >= 60 && p < 80; }).length, color: [251, 191, 36], cat: 'At Risk' },
                { label: 'Below 60%', count: reportData.filter((r: any) => parseFloat(r.attendance_percentage) < 60).length, color: [248, 113, 113], cat: 'Critical' },
            ];
            const maxDistR = Math.max(...distR.map(d => d.count), 1);
            const lblW2 = 22; const trW2 = pageW - 14 - lblW2 - 30; const bH2 = 12; const bG2 = 5;
            distR.forEach(d => {
                const bW = Math.max(3, (d.count / maxDistR) * trW2);
                doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                doc.text(d.label, 14, y + 8.5);
                doc.setFillColor(235, 237, 250); doc.rect(14 + lblW2, y, trW2, bH2, 'F');
                doc.setFillColor(...d.color); doc.rect(14 + lblW2, y, bW, bH2, 'F');
                doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                doc.text(`${d.count} students (${d.cat})`, 14 + lblW2 + bW + 4, y + 8.5);
                y += bH2 + bG2;
            });
            y += 8;

            const riskList = reportData.filter((r: any) => parseFloat(r.attendance_percentage) < 80).sort((a: any, b: any) => parseFloat(a.attendance_percentage) - parseFloat(b.attendance_percentage));
            if (riskList.length > 0) {
                doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(185, 28, 28);
                doc.text(`[!] At-Risk Students (${riskList.length})`, 14, y); doc.setTextColor(0, 0, 0); y += 6;
                autoTable(doc, { startY: y, ...tableOpts([['Roll No', 'Name', 'Grade', 'Section', 'Present', 'Absent', 'Late', 'Attendance %']],
                    riskList.map((r: any) => [r.roll_number, r.full_name, r.grade, r.section, r.present_days, r.absent_days, r.late_days, `${parseFloat(r.attendance_percentage).toFixed(1)}%`])) });
                y = (doc as any).lastAutoTable.finalY + 10;
            }
            doc.addPage(); y = 16;
            addSectionTitle('Complete Attendance Records');
            autoTable(doc, { startY: y, ...tableOpts([['Roll No', 'Name', 'Grade', 'Section', 'Total', 'Present', 'Absent', 'Late', 'Attendance %']],
                reportData.map((r: any) => [r.roll_number, r.full_name, r.grade, r.section, r.total_days, r.present_days, r.absent_days, r.late_days, `${parseFloat(r.attendance_percentage).toFixed(1)}%`])) });
        }

        if (activeTab === 'exam') {
            const validScore = reportData.filter((r: any) => r.average_score !== null);
            const avgScore = validScore.length ? validScore.reduce((s: number, r: any) => s + parseFloat(r.average_score), 0) / validScore.length : 0;
            const totalSub = reportData.reduce((s: number, r: any) => s + parseInt(r.submitted_count || 0), 0);
            const totalSlots = reportData.reduce((s: number, r: any) => s + parseInt(r.total_students || 0), 0);
            const subRate = totalSlots > 0 ? (totalSub / totalSlots) * 100 : 0;

            addSectionTitle('Summary Metrics');
            autoTable(doc, { startY: y, ...tableOpts([['Metric', 'Value', 'Status']], [
                ['Total Exams', `${reportData.length}`, '—'],
                ['Overall Avg Score', avgScore > 0 ? avgScore.toFixed(1) : '—', avgScore >= 60 ? '[OK] Good' : '[!] Needs Review'],
                ['Submission Rate', subRate > 0 ? `${subRate.toFixed(0)}%` : '—', subRate >= 70 ? '[OK] Good' : '[!] Low'],
                ['Total Submissions', `${totalSub} / ${totalSlots}`, '—'],
            ]) }); y = (doc as any).lastAutoTable.finalY + 10;

            // ─ Visual: Exam Score Comparison Chart
            if (reportData.length > 0) {
                doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                doc.text('Exam Score Comparison Chart', 14, y); y += 8;
                const eRows = reportData.map((r: any) => ({
                    label: `${(r.exam_title || '').substring(0, 20)} (${r.grade}-${r.section})`,
                    avg: r.average_score !== null ? parseFloat(r.average_score) : 0,
                    highest: r.highest_score !== null ? parseFloat(r.highest_score) : 0,
                    lowest: r.lowest_score !== null ? parseFloat(r.lowest_score) : 0,
                }));
                const maxVal2 = Math.max(...eRows.map(e => e.highest || e.avg), 1);
                const exLW = 52; const exTW = pageW - 14 - exLW - 20;
                const rH = 12; const rG = 5; const sH = rH / 3;
                eRows.slice(0, 10).forEach(e => {
                    const avgW = Math.max(2, (e.avg / maxVal2) * exTW);
                    const highW = Math.max(2, (e.highest / maxVal2) * exTW);
                    const lowW = Math.max(2, (e.lowest / maxVal2) * exTW);
                    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                    doc.text(e.label.substring(0, 26), 14, y + 8);
                    doc.setFillColor(235, 237, 250); doc.rect(14 + exLW, y, exTW, rH, 'F');
                    doc.setFillColor(248, 113, 113); doc.rect(14 + exLW, y, lowW, sH, 'F');
                    doc.setFillColor(99, 102, 241); doc.rect(14 + exLW, y + sH, avgW, sH, 'F');
                    doc.setFillColor(34, 197, 94); doc.rect(14 + exLW, y + 2 * sH, highW, sH, 'F');
                    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                    doc.text(`Avg: ${e.avg.toFixed(0)}  Hi: ${e.highest.toFixed(0)}  Lo: ${e.lowest.toFixed(0)}`, 14 + exLW + Math.max(avgW, highW, lowW) + 4, y + 8);
                    y += rH + rG;
                });
                y += 3;
                [{ label: 'Lowest', color: [248, 113, 113] as [number,number,number], x: 14 }, { label: 'Average', color: [99, 102, 241] as [number,number,number], x: 65 }, { label: 'Highest', color: [34, 197, 94] as [number,number,number], x: 116 }].forEach(({ label, color, x }) => {
                    doc.setFillColor(...color); doc.rect(x, y, 6, 5, 'F');
                    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50); doc.text(label, x + 8, y + 4.5);
                });
                y += 12;
            }

            addSectionTitle('Per-Exam Performance Breakdown');
            autoTable(doc, { startY: y, ...tableOpts([['Exam Title', 'Grade', 'Sec', 'Avg', 'High', 'Low', 'Submitted', 'Total', 'Rate', 'Status']],
                reportData.map((r: any) => {
                    const t = parseInt(r.total_students || 0); const s = parseInt(r.submitted_count || 0);
                    const sr = t > 0 ? Math.round((s / t) * 100) : 0;
                    const avg = r.average_score !== null ? parseFloat(r.average_score).toFixed(1) : '—';
                    return [r.exam_title, r.grade, r.section, avg, r.highest_score ?? '—', r.lowest_score ?? '—', s, t, `${sr}%`, parseFloat(avg) < 50 ? '[!] Low' : '[OK] Pass'];
                })) });
        }

        if (activeTab === 'certificate') {
            const typeMap: Record<string, number> = {};
            reportData.forEach((r: any) => { typeMap[r.certificate_type] = (typeMap[r.certificate_type] || 0) + 1; });
            const topType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

            addSectionTitle('Summary Metrics');
            autoTable(doc, { startY: y, ...tableOpts([['Metric', 'Value']], [
                ['Total Certificates Issued', `${reportData.length}`],
                ['Most Common Type', topType],
                ['Unique Types', `${Object.keys(typeMap).length}`],
            ]) }); y = (doc as any).lastAutoTable.finalY + 10;

            addSectionTitle('Breakdown by Certificate Type');
            autoTable(doc, { startY: y, ...tableOpts([['Certificate Type', 'Count', '% of Total']],
                Object.entries(typeMap).sort((a, b) => b[1] - a[1]).map(([type, count]) => [type, count, `${((count / reportData.length) * 100).toFixed(0)}%`])) });
            y = (doc as any).lastAutoTable.finalY + 10;

            // Student details table on same or next page
            addSectionTitle('Certificate Recipients - Full Details');
            autoTable(doc, { startY: y, ...tableOpts(
                [['Cert. No.', 'Student Name', 'Certificate Type', 'Grade', 'Sec.', 'Issue Date', 'Issued By']],
                reportData.map((r: any) => [
                    r.certificate_number || '—',
                    r.student_name,
                    r.certificate_type,
                    r.grade,
                    r.section,
                    r.issue_date ? new Date(r.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
                    r.issued_by || '—',
                ])
            ) });
        }

        if (activeTab === 'scholarship') {
            const totalAmt = reportData.reduce((s: number, r: any) => s + parseFloat(r.amount || 0), 0);
            // Fix: r.grade may already be 'Grade X' — don't double-prefix
            const gradeMap: Record<string, number> = {};
            reportData.forEach((r: any) => {
                const gKey = String(r.grade).toLowerCase().startsWith('grade') ? String(r.grade) : `Grade ${r.grade}`;
                gradeMap[gKey] = (gradeMap[gKey] || 0) + 1;
            });
            const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
            const fmtAmt = (a: any) => `Rs.${parseFloat(a || 0).toLocaleString('en-IN')}`;

            addSectionTitle('Summary Metrics');
            autoTable(doc, { startY: y, ...tableOpts([['Metric', 'Value']], [
                ['Total Recipients', `${reportData.length}`],
                ['Total Amount Awarded', fmtAmt(totalAmt)],
                ['Average Per Student', fmtAmt(totalAmt / reportData.length)],
            ]) }); y = (doc as any).lastAutoTable.finalY + 10;

            addSectionTitle('Recipients by Grade');
            autoTable(doc, { startY: y, ...tableOpts([['Grade', 'Recipients']],
                Object.entries(gradeMap).sort().map(([grade, count]) => [grade, count])) });
            y = (doc as any).lastAutoTable.finalY + 10;

            addSectionTitle('Full Scholarship Records');
            autoTable(doc, { startY: y, ...tableOpts([['Title', 'Student', 'Grade', 'Section', 'Amount', 'Awarded Date', 'Description']],
                reportData.map((r: any) => [r.title, r.student_name, r.grade, r.section, fmtAmt(r.amount), fmtDate(r.awarded_date), (r.description || '—').substring(0, 40)])) });
        }

        if (activeTab === 'user') {
            const roleMap: Record<string, { active: number; inactive: number }> = {};
            reportData.forEach((r: any) => {
                if (!roleMap[r.role]) roleMap[r.role] = { active: 0, inactive: 0 };
                if (r.status === 'Active') roleMap[r.role].active++; else roleMap[r.role].inactive++;
            });
            const totalActive = reportData.filter((r: any) => r.status === 'Active').length;

            addSectionTitle('Summary Metrics');
            autoTable(doc, { startY: y, ...tableOpts([['Metric', 'Value', 'Status']], [
                ['Total Users', `${reportData.length}`, '—'],
                ['Active Users', `${totalActive}`, totalActive / reportData.length >= 0.9 ? '[OK] Excellent' : '[!] Review Inactive'],
                ['Inactive Users', `${reportData.length - totalActive}`, reportData.length - totalActive > 0 ? '[!] Follow Up' : '[OK] None'],
                ['Active Rate', `${((totalActive / reportData.length) * 100).toFixed(0)}%`, '—'],
            ]) }); y = (doc as any).lastAutoTable.finalY + 10;

            addSectionTitle('Users by Role');
            autoTable(doc, { startY: y, ...tableOpts([['Role', 'Total', 'Active', 'Inactive']],
                Object.entries(roleMap).map(([role, counts]) => [role.charAt(0).toUpperCase() + role.slice(1), counts.active + counts.inactive, counts.active, counts.inactive])) });
            y = (doc as any).lastAutoTable.finalY + 10;

            doc.addPage(); y = 16;
            addSectionTitle('Full User Records');
            autoTable(doc, { startY: y, ...tableOpts([['ID', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Class / Subject']],
                reportData.map((r: any) => [r.id, r.name, r.email, r.role, r.status, r.joined_date, r.class_or_subject || 'N/A'])) });
        }

        if (activeTab === 'ptm') {
            const parentFb = reportData.filter((r: any) => r.feedback_from === 'parent').length;
            const teacherFb = reportData.filter((r: any) => r.feedback_from === 'teacher').length;
            const teacherMap: Record<string, number> = {};
            reportData.forEach((r: any) => { teacherMap[r.teacher_name] = (teacherMap[r.teacher_name] || 0) + 1; });
            const fmtD2 = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

            addSectionTitle('Summary Metrics');
            autoTable(doc, { startY: y, ...tableOpts([['Metric', 'Value']], [
                ['Total Feedback Entries', `${reportData.length}`],
                ['Parent Feedback', `${parentFb} (${reportData.length > 0 ? ((parentFb / reportData.length) * 100).toFixed(0) : 0}%)`],
                ['Teacher Feedback', `${teacherFb} (${reportData.length > 0 ? ((teacherFb / reportData.length) * 100).toFixed(0) : 0}%)`],
                ['Unique Teachers Involved', `${Object.keys(teacherMap).length}`],
            ]) }); y = (doc as any).lastAutoTable.finalY + 10;

            addSectionTitle('Feedback Count by Teacher');
            autoTable(doc, { startY: y, ...tableOpts([['Teacher Name', 'Total Feedback', 'Parent Feedback', 'Teacher Feedback']],
                Object.entries(teacherMap).sort((a, b) => b[1] - a[1]).map(([name, total]) => {
                    const tf = reportData.filter((r: any) => r.teacher_name === name && r.feedback_from === 'teacher').length;
                    const pf2 = total - tf;
                    return [name, total, pf2, tf];
                })) });
            y = (doc as any).lastAutoTable.finalY + 10;

            // Full PTM Feedback Records with actual details
            doc.addPage(); y = 16;
            addSectionTitle('Detailed PTM Feedback Records');
            autoTable(doc, { startY: y,
                head: [['Meeting Date', 'Student', 'Gr-Sec', 'Teacher', 'Parent', 'Submitted By', 'Submitted On', 'Feedback']],
                body: reportData.map((r: any) => [
                    fmtD2(r.meeting_date),
                    r.student_name,
                    `${r.grade}-${r.section}`,
                    r.teacher_name,
                    r.parent_name,
                    r.feedback_from === 'parent' ? 'Parent' : 'Teacher',
                    r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN') : '—',
                    (r.feedback || 'No feedback').substring(0, 80),
                ]),
                styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', cellWidth: 'wrap' },
                headStyles: { fillColor: [79, 70, 229] as [number,number,number], textColor: 255, fontStyle: 'bold' as const },
                alternateRowStyles: { fillColor: [245, 247, 255] as [number,number,number] },
                columnStyles: { 7: { cellWidth: 55 } },
                margin: { left: 10, right: 10 },
            });
        }

        // Page footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7.5); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
            doc.text(`EduBridge School Management System  |  Page ${i} of ${pageCount}  |  ${dateStr}`, pageW / 2, 290, { align: 'center' });
        }
        doc.save(`${activeTab}_analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const tabs = [
        { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
        { id: 'exam', label: 'Exams', icon: <FileText className="w-4 h-4" /> },
        { id: 'certificate', label: 'Certificates', icon: <Award className="w-4 h-4" /> },
        { id: 'scholarship', label: 'Scholarships', icon: <Star className="w-4 h-4" /> },
        { id: 'user', label: 'Users', icon: <Users className="w-4 h-4" /> },
        { id: 'ptm', label: 'PTM Feedback', icon: <MessageSquare className="w-4 h-4" /> },
    ];

    const renderAnalytics = () => {
        if (reportData.length === 0) return null;
        switch (activeTab) {
            case 'attendance': return <AttendanceAnalytics data={reportData} />;
            case 'exam': return <ExamAnalytics data={reportData} />;
            case 'certificate': return <CertificateAnalytics data={reportData} />;
            case 'scholarship': return <ScholarshipAnalytics data={reportData} />;
            case 'user': return <UserAnalytics data={reportData} />;
            case 'ptm': return <PTMAnalytics data={reportData} />;
        }
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-gray-500 mt-1">Process findings with visual insights to make instant decisions</p>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-2 pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabId)}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap text-sm shadow-sm ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-5 text-gray-700 font-semibold border-b pb-3">
                        <Filter className="w-5 h-5" />
                        <h2>Report Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Date filters */}
                        {['attendance', 'certificate', 'scholarship', 'ptm'].includes(activeTab) && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
                                </div>
                            </>
                        )}

                        {activeTab === 'attendance' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                    <option value="">All Classes</option>
                                    {classes.map((cls: any) => <option key={cls.id} value={cls.id}>{cls.grade} - {cls.section}</option>)}
                                </select>
                            </div>
                        )}

                        {activeTab === 'exam' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
                                        <option value="">All Grades</option>
                                        {grades.map((g: any) => <option key={g.grade} value={g.grade}>{g.grade}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam (Optional)</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                                        <option value="">All Exams</option>
                                        {allExams.filter(e => !selectedGrade || String(e.grade) === selectedGrade).map((exam: any) => (
                                            <option key={exam.id} value={exam.id}>{exam.title} - {exam.grade} {exam.section} ({exam.subject_name})</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === 'certificate' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={selectedCertTypeId} onChange={e => setSelectedCertTypeId(e.target.value)}>
                                    <option value="">All Types</option>
                                    {certificateTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}

                        {activeTab === 'user' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                        <option value="">All Roles</option>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="parent">Parent</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="col-span-1 md:col-span-4 flex justify-end mt-1">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Generating…
                                    </>
                                ) : (
                                    <><BarChart3 className="w-4 h-4" /> Generate Report</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analytics Zone */}
                {reportData.length > 0 && (
                    <div className="space-y-4">
                        {/* Section header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" /> Analytics Dashboard
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">{reportData.length} record{reportData.length !== 1 ? 's' : ''} analysed</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowTable(v => !v)}
                                    className="flex items-center gap-2 text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    {showTable ? 'Hide' : 'Show'} Raw Data
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Export PDF
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Per-tab Analytics */}
                        {renderAnalytics()}

                        {/* Raw Data Table */}
                        {showTable && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                                    <h3 className="text-sm font-bold text-gray-600">Raw Data Table</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {Object.keys(reportData[0]).map(key => (
                                                    <th key={key} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                        {key.replace(/_/g, ' ')}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                                    {Object.entries(row).map(([key, val]: any, i) => (
                                                        <td key={i} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
                                                            {key === 'attendance_percentage'
                                                                ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${attBadge(parseFloat(val))}`}>{val}%</span>
                                                                : (val ?? '—')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {reportData.length === 0 && !loading && (
                    <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Report Generated Yet</h3>
                        <p className="text-sm text-gray-500">
                            Select filters above and click{' '}
                            <span className="font-medium text-indigo-600">Generate Report</span>{' '}
                            to see visual analytics and charts.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminReports;
