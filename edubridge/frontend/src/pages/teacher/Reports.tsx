import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import {
    Download, Filter, FileText, Calendar,
    BarChart3, BookOpen, AlertCircle, TrendingUp
} from 'lucide-react';

type TabType = 'attendance' | 'exam';

const TeacherReports = () => {
    const [activeTab, setActiveTab] = useState<TabType>('attendance');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [error, setError] = useState('');

    // My classes for filter dropdown
    const [myClasses, setMyClasses] = useState<any[]>([]);

    // Filters
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [examId, setExamId] = useState('');

    useEffect(() => {
        fetchMyClasses();
    }, []);

    useEffect(() => {
        setReportData([]);
        setError('');
        // Reset filters on tab change
        setSelectedClassId('');
        setStartDate('');
        setEndDate('');
        setExamId('');
    }, [activeTab]);

    const fetchMyClasses = async () => {
        try {
            const res = await teacherAPI.getMyClasses();
            setMyClasses(res.data || []);
        } catch (e) {
            console.error('Failed to fetch classes:', e);
        }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setError('');
        setReportData([]);
        try {
            let response;
            if (activeTab === 'attendance') {
                response = await teacherAPI.getAttendanceReport(
                    selectedClassId || undefined,
                    startDate || undefined,
                    endDate || undefined
                );
            } else {
                response = await teacherAPI.getExamReport(
                    selectedClassId || undefined,
                    examId || undefined
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

    const formatColumnHeader = (key: string) =>
        key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const getAttendanceBadge = (val: any, key: string) => {
        if (key === 'attendance_percentage') {
            const pct = parseFloat(val);
            const color =
                pct >= 80 ? 'bg-green-100 text-green-800' :
                pct >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800';
            return (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
                    {val}%
                </span>
            );
        }
        return val ?? '—';
    };

    const tabs = [
        {
            id: 'attendance' as TabType,
            label: 'Attendance Report',
            icon: <Calendar className="w-4 h-4" />,
            description: 'View attendance summary for students in your classes',
        },
        {
            id: 'exam' as TabType,
            label: 'Exam Report',
            icon: <BookOpen className="w-4 h-4" />,
            description: 'Analyse performance across your exams and classes',
        },
    ];

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">

                {/* Page Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                        <p className="text-gray-600 mt-1">
                            Generate attendance & exam reports for your assigned classes
                        </p>
                    </div>
                </div>

                {/* Scope Notice */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-700">
                        <span className="font-semibold">Scoped to your classes:</span>{' '}
                        Reports only include data from classes and exams assigned to you. Contact an admin for school-wide reports.
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
                                    ? 'bg-blue-600 text-white shadow-blue-200 shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Active tab description */}
                <p className="text-sm text-gray-500 -mt-3">
                    {tabs.find(t => t.id === activeTab)?.description}
                </p>

                {/* Filters Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5 text-gray-700 font-semibold border-b pb-2">
                        <Filter className="w-5 h-5" />
                        <h2>Report Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Class filter (both tabs) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class{activeTab === 'attendance' ? '' : ' (Optional)'}
                            </label>
                            <select
                                id="report-class-select"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

                        {/* Attendance-specific: date range */}
                        {activeTab === 'attendance' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        id="report-start-date"
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        id="report-end-date"
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        min={startDate}
                                    />
                                </div>
                            </>
                        )}

                        {/* Exam-specific: exam ID */}
                        {activeTab === 'exam' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Exam ID <span className="text-gray-400">(Optional)</span>
                                </label>
                                <input
                                    id="report-exam-id"
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 5"
                                    value={examId}
                                    onChange={e => setExamId(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-5">
                        <button
                            id="generate-report-btn"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
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

                {/* Results Table */}
                {reportData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
                        {/* Results header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    Report Results
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {reportData.length} record{reportData.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                            <button
                                id="export-csv-btn"
                                onClick={handleExport}
                                className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>

                        {/* Summary stats for attendance */}
                        {activeTab === 'attendance' && (
                            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                                {[
                                    {
                                        label: 'Avg Attendance',
                                        value: (() => {
                                            const avg = reportData.reduce(
                                                (sum: number, r: any) => sum + parseFloat(r.attendance_percentage || 0), 0
                                            ) / reportData.length;
                                            return `${avg.toFixed(1)}%`;
                                        })(),
                                        color: 'text-green-600',
                                    },
                                    {
                                        label: 'Below 80%',
                                        value: reportData.filter((r: any) => parseFloat(r.attendance_percentage) < 80).length,
                                        color: 'text-red-600',
                                    },
                                    {
                                        label: 'Total Students',
                                        value: reportData.length,
                                        color: 'text-blue-600',
                                    },
                                ].map(stat => (
                                    <div key={stat.label} className="px-6 py-4 text-center">
                                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary stats for exams */}
                        {activeTab === 'exam' && (
                            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                                {[
                                    {
                                        label: 'Total Exams',
                                        value: reportData.length,
                                        color: 'text-blue-600',
                                    },
                                    {
                                        label: 'Overall Avg Score',
                                        value: (() => {
                                            const validRows = reportData.filter(
                                                (r: any) => r.average_score !== null && r.average_score !== undefined
                                            );
                                            if (!validRows.length) return '—';
                                            const avg =
                                                validRows.reduce((sum: number, r: any) => sum + parseFloat(r.average_score), 0) /
                                                validRows.length;
                                            return avg.toFixed(1);
                                        })(),
                                        color: 'text-green-600',
                                    },
                                    {
                                        label: 'Total Submissions',
                                        value: reportData.reduce(
                                            (sum: number, r: any) => sum + parseInt(r.submitted_count || 0), 0
                                        ),
                                        color: 'text-amber-600',
                                    },
                                ].map(stat => (
                                    <div key={stat.label} className="px-6 py-4 text-center">
                                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {Object.keys(reportData[0]).map(key => (
                                            <th
                                                key={key}
                                                className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                            >
                                                {formatColumnHeader(key)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            {Object.entries(row).map(([key, val]: any, i) => (
                                                <td
                                                    key={i}
                                                    className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700"
                                                >
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

                {/* Empty state (when no data & no error) */}
                {reportData.length === 0 && !error && !loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Report Generated Yet</h3>
                        <p className="text-sm text-gray-500">
                            Select filters above and click <span className="font-medium text-blue-600">Generate Report</span> to view data.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TeacherReports;
