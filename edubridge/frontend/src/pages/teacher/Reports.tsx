import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    Download, Filter, FileText, Calendar,
    BarChart3, BookOpen, AlertCircle, TrendingUp,
    Users, AlertTriangle, CheckCircle, Target,
} from 'lucide-react';

type TabType = 'attendance' | 'exam';

// ─── Colour Helpers ───────────────────────────────────────────────────────────

const PIE_COLORS = ['#6366f1', '#f87171', '#fbbf24'];

const attColor = (pct: number) =>
    pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

const attBadge = (pct: number) => {
    if (pct >= 80) return 'bg-green-100 text-green-800';
    if (pct >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

// ─── Reusable Components ──────────────────────────────────────────────────────
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
            {icons[type]}
            <span>{message}</span>
        </div>
    );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm">
            <p className="font-bold text-gray-700 mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }} className="font-medium">
                    {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                </p>
            ))}
        </div>
    );
};

// ─── Attendance Analytics ─────────────────────────────────────────────────────
const AttendanceAnalytics = ({ data }: { data: any[] }) => {
    // KPIs
    const avg = data.reduce((s, r) => s + parseFloat(r.attendance_percentage || 0), 0) / data.length;
    const atRisk = data.filter(r => parseFloat(r.attendance_percentage) < 80).length;
    const totalPresent = data.reduce((s, r) => s + Number(r.present_days || 0), 0);
    const totalAbsent = data.reduce((s, r) => s + Number(r.absent_days || 0), 0);
    const totalLate = data.reduce((s, r) => s + Number(r.late_days || 0), 0);

    // Attendance range buckets for bar chart
    const buckets = [
        { range: '90–100%', count: data.filter(r => parseFloat(r.attendance_percentage) >= 90).length, fill: '#22c55e' },
        { range: '80–89%', count: data.filter(r => { const p = parseFloat(r.attendance_percentage); return p >= 80 && p < 90; }).length, fill: '#86efac' },
        { range: '60–79%', count: data.filter(r => { const p = parseFloat(r.attendance_percentage); return p >= 60 && p < 80; }).length, fill: '#f59e0b' },
        { range: 'Below 60%', count: data.filter(r => parseFloat(r.attendance_percentage) < 60).length, fill: '#ef4444' },
    ];

    // Pie data
    const pieData = [
        { name: 'Present', value: totalPresent },
        { name: 'Absent', value: totalAbsent },
        { name: 'Late', value: totalLate },
    ].filter(d => d.value > 0);

    // Per-student bar chart (limited to 20 for readability)
    const studentBars = [...data]
        .sort((a, b) => parseFloat(a.attendance_percentage) - parseFloat(b.attendance_percentage))
        .slice(0, 20)
        .map(r => ({
            name: r.full_name?.split(' ')[0] || r.roll_number,
            pct: parseFloat(r.attendance_percentage),
            fill: attColor(parseFloat(r.attendance_percentage)),
        }));

    // At-risk list
    const riskStudents = data
        .filter(r => parseFloat(r.attendance_percentage) < 80)
        .sort((a, b) => parseFloat(a.attendance_percentage) - parseFloat(b.attendance_percentage))
        .slice(0, 5);

    return (
        <div className="space-y-5 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
                <KpiCard
                    label="Average Attendance"
                    value={`${avg.toFixed(1)}%`}
                    sub="across all students"
                    icon={TrendingUp}
                    color={avg >= 80 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}
                />
                <KpiCard
                    label="At-Risk Students"
                    value={atRisk}
                    sub="attendance below 80%"
                    icon={AlertTriangle}
                    color={atRisk > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}
                />
                <KpiCard
                    label="Total Students"
                    value={data.length}
                    sub="in selected scope"
                    icon={Users}
                    color="bg-blue-50 border-blue-200 text-blue-700"
                />
            </div>

            {/* Insight Banner */}
            {atRisk > 0 ? (
                <InsightBanner
                    type="warning"
                    message={`⚠️ ${atRisk} student${atRisk > 1 ? 's are' : ' is'} at risk with attendance below 80%. Immediate follow-up recommended.`}
                />
            ) : (
                <InsightBanner
                    type="success"
                    message="✅ All students are maintaining attendance above 80%. Great performance!"
                />
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Distribution Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Attendance Distribution by Range</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={buckets} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                                {buckets.map((b, i) => (
                                    <Cell key={i} fill={b.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Overall Attendance Breakdown</h3>
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

            {/* Per-Student Bar (bottom performers) */}
            {studentBars.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-1">
                        Student Attendance % <span className="text-gray-400 font-normal">(sorted ascending — showing bottom 20)</span>
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

            {/* At-Risk Quick List */}
            {riskStudents.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Students Requiring Immediate Attention (Top 5 Most At-Risk)
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

// ─── Exam Analytics ───────────────────────────────────────────────────────────
const ExamAnalytics = ({ data }: { data: any[] }) => {
    const validScore = data.filter(r => r.average_score !== null && r.average_score !== undefined);
    const avgScore = validScore.length
        ? validScore.reduce((s, r) => s + parseFloat(r.average_score), 0) / validScore.length : 0;
    const totalSubmissions = data.reduce((s, r) => s + parseInt(r.submitted_count || 0), 0);
    const totalStudentSlots = data.reduce((s, r) => s + parseInt(r.total_students || 0), 0);
    const submissionRate = totalStudentSlots > 0 ? (totalSubmissions / totalStudentSlots) * 100 : 0;

    const lowPerforming = data.filter(r => r.average_score !== null && parseFloat(r.average_score) < 50);
    const lowSubmission = data.filter(r => {
        const total = parseInt(r.total_students || 0);
        const submitted = parseInt(r.submitted_count || 0);
        return total > 0 && (submitted / total) < 0.7;
    });

    // Bar chart data
    const barData = data.map(r => ({
        name: r.exam_title?.length > 14 ? r.exam_title.substring(0, 14) + '…' : r.exam_title,
        fullName: r.exam_title,
        avg: r.average_score !== null ? parseFloat(parseFloat(r.average_score).toFixed(1)) : 0,
        highest: r.highest_score !== null ? parseFloat(parseFloat(r.highest_score).toFixed(1)) : 0,
        lowest: r.lowest_score !== null ? parseFloat(parseFloat(r.lowest_score).toFixed(1)) : 0,
        submitted: parseInt(r.submitted_count || 0),
        total: parseInt(r.total_students || 0),
        grade: r.grade,
        section: r.section,
    }));

    // Submission rate chart
    const submissionData = data.map(r => {
        const total = parseInt(r.total_students || 0);
        const submitted = parseInt(r.submitted_count || 0);
        return {
            name: r.exam_title?.length > 14 ? r.exam_title.substring(0, 14) + '…' : r.exam_title,
            fullName: r.exam_title,
            rate: total > 0 ? Math.round((submitted / total) * 100) : 0,
            submitted,
            total,
        };
    });

    return (
        <div className="space-y-5 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
                <KpiCard
                    label="Total Exams"
                    value={data.length}
                    sub="in selected scope"
                    icon={BookOpen}
                    color="bg-indigo-50 border-indigo-200 text-indigo-700"
                />
                <KpiCard
                    label="Overall Avg Score"
                    value={avgScore > 0 ? avgScore.toFixed(1) : '—'}
                    sub="across all exams"
                    icon={Target}
                    color={avgScore >= 60 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}
                />
                <KpiCard
                    label="Submission Rate"
                    value={submissionRate > 0 ? `${submissionRate.toFixed(0)}%` : '—'}
                    sub={`${totalSubmissions} / ${totalStudentSlots} submitted`}
                    icon={CheckCircle}
                    color={submissionRate >= 70 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}
                />
            </div>

            {/* Insight Banners */}
            <div className="space-y-2">
                {lowPerforming.length > 0 && (
                    <InsightBanner
                        type="warning"
                        message={`⚠️ ${lowPerforming.length} exam${lowPerforming.length > 1 ? 's have' : ' has'} an average score below 50 — consider reviewing those topics.`}
                    />
                )}
                {lowSubmission.length > 0 && (
                    <InsightBanner
                        type="warning"
                        message={`📋 ${lowSubmission.length} exam${lowSubmission.length > 1 ? 's have' : ' has'} submission rate below 70%. Students may need reminders.`}
                    />
                )}
                {lowPerforming.length === 0 && lowSubmission.length === 0 && (
                    <InsightBanner
                        type="success"
                        message="✅ All exams have good average scores and healthy submission rates. Keep it up!"
                    />
                )}
            </div>

            {/* Score Charts */}
            {barData.length > 0 && (
                <>
                    {/* Avg / High / Low per exam */}
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

                    {/* Submission Rate per exam */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Submission Rate Per Exam (%)</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={submissionData} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                                <Bar dataKey="rate" name="Submission Rate" radius={[5, 5, 0, 0]}>
                                    {submissionData.map((d, i) => (
                                        <Cell key={i} fill={d.rate >= 70 ? '#6366f1' : '#f87171'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Per-exam score cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {barData.map((exam, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{exam.grade}-{exam.section}</p>
                                <p className="text-sm font-semibold text-gray-800 truncate mb-3">{exam.fullName}</p>
                                <div className="flex justify-between text-center text-xs">
                                    <div>
                                        <p className="text-lg font-bold text-green-600">{exam.highest || '—'}</p>
                                        <p className="text-gray-400">Highest</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-indigo-600">{exam.avg || '—'}</p>
                                        <p className="text-gray-400">Avg</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-red-500">{exam.lowest || '—'}</p>
                                        <p className="text-gray-400">Lowest</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-700">{exam.submitted}/{exam.total}</p>
                                        <p className="text-gray-400">Submitted</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TeacherReports = () => {
    const [activeTab, setActiveTab] = useState<TabType>('attendance');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [myClasses, setMyClasses] = useState<any[]>([]);
    const [myExams, setMyExams] = useState<any[]>([]);
    const [showTable, setShowTable] = useState(false);

    // Filters
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [examId, setExamId] = useState('');

    useEffect(() => { fetchMyClasses(); fetchMyExams(); }, []);

    useEffect(() => {
        setReportData([]);
        setError('');
        setShowTable(false);
        setSelectedClassId('');
        setStartDate('');
        setEndDate('');
        setExamId('');
    }, [activeTab]);

    const fetchMyClasses = async () => {
        try {
            const res = await teacherAPI.getMyClasses();
            setMyClasses(res.data || []);
        } catch (e) { console.error('Failed to fetch classes:', e); }
    };

    const fetchMyExams = async () => {
        try {
            const res = await teacherAPI.getExams();
            setMyExams(res.data || []);
        } catch (e) { console.error('Failed to fetch exams:', e); }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setError('');
        setReportData([]);
        setShowTable(false);
        try {
            let response;
            if (activeTab === 'attendance') {
                response = await teacherAPI.getAttendanceReport(
                    selectedClassId || undefined,
                    startDate || undefined,
                    endDate || undefined,
                );
            } else {
                response = await teacherAPI.getExamReport(
                    selectedClassId || undefined,
                    examId || undefined,
                );
            }
            const data = response?.data || [];
            if (data.length === 0) {
                setError('No records found for the selected filters. Try adjusting your criteria.');
            }
            setReportData(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (reportData.length === 0) return;
        const headers = Object.keys(reportData[0]).join(',');
        const rows = reportData
            .map(row => Object.values(row).map(val => `"${val ?? ''}"`).join(','))
            .join('\n');
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

        // ── Header ──
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text(activeTab === 'attendance' ? 'Attendance Analytics Report' : 'Exam Performance Report', 14, 12);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${dateStr}  |  EduBridge School Management System`, 14, 21);
        doc.setTextColor(0, 0, 0);
        let y = 36;

        if (activeTab === 'attendance') {
            const avg = reportData.reduce((s: number, r: any) => s + parseFloat(r.attendance_percentage || 0), 0) / reportData.length;
            const atRisk = reportData.filter((r: any) => parseFloat(r.attendance_percentage) < 80).length;
            const totalPresent = reportData.reduce((s: number, r: any) => s + Number(r.present_days || 0), 0);
            const totalAbsent = reportData.reduce((s: number, r: any) => s + Number(r.absent_days || 0), 0);
            const totalLate = reportData.reduce((s: number, r: any) => s + Number(r.late_days || 0), 0);

            // ─ KPI Summary Table
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
            doc.text('Summary Metrics', 14, y); y += 6;
            autoTable(doc, {
                startY: y,
                head: [['Metric', 'Value', 'Status']],
                body: [
                    ['Average Attendance', `${avg.toFixed(1)}%`, avg >= 80 ? '[OK] Good' : '[!] Needs Attention'],
                    ['At-Risk Students (<80%)', `${atRisk} students`, atRisk > 0 ? '[!] Action Required' : '[OK] None'],
                    ['Total Students', `${reportData.length}`, '—'],
                    ['Total Present Days', `${totalPresent}`, '—'],
                    ['Total Absent Days', `${totalAbsent}`, totalAbsent > totalPresent * 0.2 ? '[!] High' : '[OK] Acceptable'],
                    ['Total Late Days', `${totalLate}`, '—'],
                ],
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 247, 255] },
                margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;

            // ─ Visual Chart 1: Stacked Bar (Present / Late / Absent)
            const totalAll = totalPresent + totalAbsent + totalLate;
            if (totalAll > 0) {
                doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                doc.text('Attendance Composition', 14, y); y += 7;
                const segBarW = pageW - 28;
                const segH = 14;
                const pW = (totalPresent / totalAll) * segBarW;
                const lW = (totalLate / totalAll) * segBarW;
                const aW = (totalAbsent / totalAll) * segBarW;
                doc.setFillColor(34, 197, 94);  doc.rect(14, y, pW, segH, 'F');
                doc.setFillColor(251, 191, 36); doc.rect(14 + pW, y, lW, segH, 'F');
                doc.setFillColor(248, 113, 113); doc.rect(14 + pW + lW, y, aW, segH, 'F');
                // Inline labels inside bar segments (if wide enough)
                doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
                if (pW > 20) doc.text(`${((totalPresent/totalAll)*100).toFixed(0)}%`, 14 + pW/2, y + 9, { align: 'center' });
                if (lW > 20) doc.text(`${((totalLate/totalAll)*100).toFixed(0)}%`, 14 + pW + lW/2, y + 9, { align: 'center' });
                if (aW > 20) doc.text(`${((totalAbsent/totalAll)*100).toFixed(0)}%`, 14 + pW + lW + aW/2, y + 9, { align: 'center' });
                y += segH + 5;
                // Legend row
                const legend = [
                    { label: `Present: ${totalPresent}`, color: [34, 197, 94] as [number,number,number], x: 14 },
                    { label: `Late: ${totalLate}`, color: [251, 191, 36] as [number,number,number], x: 80 },
                    { label: `Absent: ${totalAbsent}`, color: [248, 113, 113] as [number,number,number], x: 130 },
                ];
                legend.forEach(({ label, color, x }) => {
                    doc.setFillColor(...color); doc.rect(x, y, 6, 5, 'F');
                    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                    doc.text(label, x + 8, y + 4.5);
                });
                y += 12;
            }

            // ─ Visual Chart 2: Distribution Horizontal Bar Chart
            doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
            doc.text('Attendance Distribution Chart', 14, y); y += 8;
            const distRows: { label: string; count: number; color: [number,number,number]; cat: string }[] = [
                { label: '90-100%', count: reportData.filter((r: any) => parseFloat(r.attendance_percentage) >= 90).length, color: [34, 197, 94], cat: 'Excellent' },
                { label: '80-89%',  count: reportData.filter((r: any) => { const p = parseFloat(r.attendance_percentage); return p >= 80 && p < 90; }).length, color: [134, 239, 172], cat: 'Good' },
                { label: '60-79%',  count: reportData.filter((r: any) => { const p = parseFloat(r.attendance_percentage); return p >= 60 && p < 80; }).length, color: [251, 191, 36], cat: 'At Risk' },
                { label: 'Below 60%', count: reportData.filter((r: any) => parseFloat(r.attendance_percentage) < 60).length, color: [248, 113, 113], cat: 'Critical' },
            ];
            const maxDist = Math.max(...distRows.map(d => d.count), 1);
            const labelColW = 22; const trackW = pageW - 14 - labelColW - 30;
            const bH = 12; const bGap = 5;
            distRows.forEach(d => {
                const bW = Math.max(3, (d.count / maxDist) * trackW);
                doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                doc.text(d.label, 14, y + 8.5);
                doc.setFillColor(235, 237, 250); doc.rect(14 + labelColW, y, trackW, bH, 'F');
                doc.setFillColor(...d.color); doc.rect(14 + labelColW, y, bW, bH, 'F');
                doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                doc.text(`${d.count} students  (${d.cat})`, 14 + labelColW + bW + 4, y + 8.5);
                y += bH + bGap;
            });
            y += 8;

            // ─ At-Risk Students Table
            const riskList = reportData
                .filter((r: any) => parseFloat(r.attendance_percentage) < 80)
                .sort((a: any, b: any) => parseFloat(a.attendance_percentage) - parseFloat(b.attendance_percentage));
            if (riskList.length > 0) {
                doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(185, 28, 28);
                doc.text(`[!] At-Risk Students (${riskList.length})`, 14, y);
                doc.setTextColor(0, 0, 0); y += 6;
                autoTable(doc, {
                    startY: y,
                    head: [['Roll No', 'Student Name', 'Grade', 'Section', 'Present', 'Absent', 'Late', 'Attendance %']],
                    body: riskList.map((r: any) => [r.roll_number, r.full_name, r.grade, r.section, r.present_days, r.absent_days, r.late_days, `${parseFloat(r.attendance_percentage).toFixed(1)}%`]),
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [255, 245, 245] },
                    margin: { left: 14, right: 14 },
                });
                y = (doc as any).lastAutoTable.finalY + 10;
            }

            // ─ Full records on next page
            doc.addPage(); y = 16;
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
            doc.text('Complete Attendance Records', 14, y); y += 6;
            autoTable(doc, {
                startY: y,
                head: [['Roll No', 'Name', 'Grade', 'Section', 'Total Days', 'Present', 'Absent', 'Late', 'Attendance %']],
                body: reportData.map((r: any) => [r.roll_number, r.full_name, r.grade, r.section, r.total_days, r.present_days, r.absent_days, r.late_days, `${parseFloat(r.attendance_percentage).toFixed(1)}%`]),
                styles: { fontSize: 7.5, cellPadding: 2 },
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 247, 255] },
                margin: { left: 14, right: 14 },
            });
        }

        if (activeTab === 'exam') {
            const validScore = reportData.filter((r: any) => r.average_score !== null && r.average_score !== undefined);
            const avgScore = validScore.length ? validScore.reduce((s: number, r: any) => s + parseFloat(r.average_score), 0) / validScore.length : 0;
            const totalSubmissions = reportData.reduce((s: number, r: any) => s + parseInt(r.submitted_count || 0), 0);
            const totalSlots = reportData.reduce((s: number, r: any) => s + parseInt(r.total_students || 0), 0);
            const subRate = totalSlots > 0 ? (totalSubmissions / totalSlots) * 100 : 0;

            // ─ KPI Summary Table
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
            doc.text('Summary Metrics', 14, y); y += 6;
            autoTable(doc, {
                startY: y,
                head: [['Metric', 'Value', 'Status']],
                body: [
                    ['Total Exams', `${reportData.length}`, '—'],
                    ['Overall Average Score', avgScore > 0 ? avgScore.toFixed(1) : '—', avgScore >= 60 ? '[OK] Good' : '[!] Needs Review'],
                    ['Submission Rate', subRate > 0 ? `${subRate.toFixed(0)}%` : '—', subRate >= 70 ? '[OK] Good' : '[!] Low'],
                    ['Total Submissions', `${totalSubmissions} / ${totalSlots}`, '—'],
                ],
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 247, 255] },
                margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;

            // ─ Visual Chart: Exam Score Comparison (Lowest / Avg / Highest per exam)
            if (reportData.length > 0) {
                doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                doc.text('Exam Score Comparison Chart', 14, y); y += 8;
                const examRows = reportData.map((r: any) => ({
                    label: `${(r.exam_title || 'Exam').substring(0, 20)} (${r.grade}-${r.section})`,
                    avg: r.average_score !== null ? parseFloat(r.average_score) : 0,
                    highest: r.highest_score !== null ? parseFloat(r.highest_score) : 0,
                    lowest: r.lowest_score !== null ? parseFloat(r.lowest_score) : 0,
                }));
                const maxVal = Math.max(...examRows.map(e => e.highest || e.avg), 1);
                const exLabelW = 52; const exTrackW = pageW - 14 - exLabelW - 20;
                const rowH = 12; const rowGap = 5;
                const segH = rowH / 3;

                examRows.slice(0, 10).forEach(e => {
                    const avgW = Math.max(2, (e.avg / maxVal) * exTrackW);
                    const highW = Math.max(2, (e.highest / maxVal) * exTrackW);
                    const lowW = Math.max(2, (e.lowest / maxVal) * exTrackW);
                    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                    doc.text(e.label.substring(0, 26), 14, y + 8);
                    // BG track
                    doc.setFillColor(235, 237, 250); doc.rect(14 + exLabelW, y, exTrackW, rowH, 'F');
                    // Low (red bottom strip)
                    doc.setFillColor(248, 113, 113); doc.rect(14 + exLabelW, y, lowW, segH, 'F');
                    // Avg (indigo middle strip)
                    doc.setFillColor(99, 102, 241); doc.rect(14 + exLabelW, y + segH, avgW, segH, 'F');
                    // High (green top strip)
                    doc.setFillColor(34, 197, 94); doc.rect(14 + exLabelW, y + 2 * segH, highW, segH, 'F');
                    // Value label
                    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
                    doc.text(`Avg: ${e.avg.toFixed(0)}  Hi: ${e.highest.toFixed(0)}  Lo: ${e.lowest.toFixed(0)}`, 14 + exLabelW + Math.max(avgW, highW, lowW) + 4, y + 8);
                    y += rowH + rowGap;
                });

                // Legend
                y += 2;
                [
                    { label: 'Lowest Score', color: [248, 113, 113] as [number,number,number], x: 14 },
                    { label: 'Average Score', color: [99, 102, 241] as [number,number,number], x: 72 },
                    { label: 'Highest Score', color: [34, 197, 94] as [number,number,number], x: 136 },
                ].forEach(({ label, color, x }) => {
                    doc.setFillColor(...color); doc.rect(x, y, 6, 5, 'F');
                    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
                    doc.text(label, x + 8, y + 4.5);
                });
                y += 13;
            }

            // ─ Per-Exam Breakdown Table
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
            doc.text('Per-Exam Performance Breakdown', 14, y); y += 6;
            autoTable(doc, {
                startY: y,
                head: [['Exam Title', 'Grade', 'Sec', 'Avg', 'Highest', 'Lowest', 'Submitted', 'Total', 'Rate', 'Status']],
                body: reportData.map((r: any) => {
                    const t = parseInt(r.total_students || 0);
                    const s = parseInt(r.submitted_count || 0);
                    const sr = t > 0 ? Math.round((s / t) * 100) : 0;
                    const avg = r.average_score !== null ? parseFloat(r.average_score).toFixed(1) : '—';
                    return [r.exam_title, r.grade, r.section, avg, r.highest_score ?? '—', r.lowest_score ?? '—', s, t, `${sr}%`, parseFloat(avg) < 50 ? '[!] Low' : '[OK] Pass'];
                }),
                styles: { fontSize: 7.5, cellPadding: 2.5 },
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 247, 255] },
                margin: { left: 14, right: 14 },
            });

            y = (doc as any).lastAutoTable.finalY + 10;
            const lowPerf = reportData.filter((r: any) => r.average_score !== null && parseFloat(r.average_score) < 50);
            if (lowPerf.length > 0) {
                doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(185, 28, 28);
                doc.text(`Action Required: ${lowPerf.length} exam(s) with average score below 50.`, 14, y);
                doc.setTextColor(0, 0, 0);
            }
        }

        // Footer on all pages
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7.5); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
            doc.text(`EduBridge School Management System  |  Page ${i} of ${pageCount}  |  ${dateStr}`, pageW / 2, 290, { align: 'center' });
        }

        doc.save(`${activeTab}_analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const formatColumnHeader = (key: string) =>
        key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const getAttendanceBadge = (val: any, key: string) => {
        if (key === 'attendance_percentage') {
            const pct = parseFloat(val);
            return (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${attBadge(pct)}`}>
                    {val}%
                </span>
            );
        }
        return val ?? '—';
    };

    const tabs = [
        { id: 'attendance' as TabType, label: 'Attendance Report', icon: <Calendar className="w-4 h-4" />, description: 'View attendance summary for students in your classes' },
        { id: 'exam' as TabType, label: 'Exam Report', icon: <BookOpen className="w-4 h-4" />, description: 'Analyse performance across your exams and classes' },
    ];

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">

                {/* Page Header */}
                <div className="mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-gray-500 mt-1">Visual insights from your class data to support instant decisions</p>
                </div>

                {/* Scope Notice */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-700">
                        <span className="font-semibold">Scoped to your classes:</span>{' '}
                        Reports only include data from classes and exams assigned to you.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-3">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <p className="text-sm text-gray-500 -mt-3">
                    {tabs.find(t => t.id === activeTab)?.description}
                </p>

                {/* Filters Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5 text-gray-700 font-semibold border-b pb-2">
                        <Filter className="w-5 h-5" />
                        <h2>Report Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Class filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class{activeTab === 'attendance' ? '' : ' (Optional)'}
                            </label>
                            <select
                                id="report-class-select"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                            >
                                <option value="">All My Classes</option>
                                {myClasses.map((cls: any) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.grade} – {cls.section}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {activeTab === 'attendance' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        id="report-start-date"
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        id="report-end-date"
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        min={startDate}
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'exam' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Exam <span className="text-gray-400">(Optional)</span>
                                </label>
                                <select
                                    id="report-exam-id"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    value={examId}
                                    onChange={e => setExamId(e.target.value)}
                                >
                                    <option value="">All My Exams</option>
                                    {myExams.map((exam: any) => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.title} — {exam.grade ?? ''}{exam.section ? `-${exam.section}` : ''} ({exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : 'No date'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-5">
                        <button
                            id="generate-report-btn"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                                <>
                                    <BarChart3 className="w-4 h-4" />
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-700">{error}</p>
                    </div>
                )}

                {/* ── Analytics Zone ── */}
                {reportData.length > 0 && (
                    <div className="space-y-4">
                        {/* Section header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    Analytics Dashboard
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
                                    id="export-pdf-btn"
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </button>
                                <button
                                    id="export-csv-btn"
                                    onClick={handleExport}
                                    className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Charts */}
                        {activeTab === 'attendance' && <AttendanceAnalytics data={reportData} />}
                        {activeTab === 'exam' && <ExamAnalytics data={reportData} />}

                        {/* Raw Data Table (collapsible) */}
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
                                                        {formatColumnHeader(key)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                                    {Object.entries(row).map(([key, val]: any, i) => (
                                                        <td key={i} className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">
                                                            {getAttendanceBadge(val, key)}
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
                {reportData.length === 0 && !error && !loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Report Generated Yet</h3>
                        <p className="text-sm text-gray-500">
                            Select filters above and click{' '}
                            <span className="font-medium text-indigo-600">Generate Report</span>{' '}
                            to see analytics and charts.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TeacherReports;
