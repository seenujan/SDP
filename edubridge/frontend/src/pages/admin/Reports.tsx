import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api'; // Expecting new API methods here
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, FileText } from 'lucide-react';

const Reports = () => {
    const [activeTab, setActiveTab] = useState<'attendance' | 'exam'>('attendance');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);

    // Filters
    const [grades, setGrades] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    // Selected Filters
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        // Reset data when tab changes
        setReportData([]);
        if (activeTab === 'exam' && selectedGrade) {
            // fetchExamsForGrade(selectedGrade); // Assuming we can fetch this
        }
    }, [activeTab]);

    const fetchMetadata = async () => {
        try {
            const gradesRes = await adminAPI.getGrades(); // Reusing existing
            setGrades(gradesRes.data);

            const classesRes = await adminAPI.getClasses(); // Need to check if this exists or similar
            setClasses(classesRes.data);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'attendance') {
                response = await adminAPI.getAttendanceReport(selectedClassId, startDate, endDate);
            } else {
                response = await adminAPI.getExamReport(selectedGrade, selectedExamId);
            }
            setReportData(response.data);
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (reportData.length === 0) return;

        // Simple CSV Export
        const headers = Object.keys(reportData[0]).join(',');
        const rows = reportData.map(row => Object.values(row).join(',')).join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeTab}_report_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                        <p className="text-gray-600 mt-1">Generate and analyze academic performace and attendance reports</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'attendance' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            Attendance Report
                        </button>
                        <button
                            onClick={() => setActiveTab('exam')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'exam' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            Exam Report
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                        <Filter className="w-5 h-5" />
                        <h2>Report Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {activeTab === 'attendance' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                    <select
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((cls: any) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.grade} - {cls.section}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                    <select
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={selectedGrade}
                                        onChange={(e) => setSelectedGrade(e.target.value)}
                                    >
                                        <option value="">Select Grade</option>
                                        {grades.map((g: any) => (
                                            <option key={g.grade} value={g.grade}>{g.grade}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam ID (Optional)</label>
                                    <input
                                        type="number"
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        placeholder="Ex: 10"
                                        value={selectedExamId}
                                        onChange={(e) => setSelectedExamId(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex items-end">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? 'Generating...' : <><FileText className="w-4 h-4" /> Generate Report</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {reportData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {activeTab === 'attendance' ? 'Attendance Analysis' : 'Exam Performance Analysis'}
                            </h2>
                            <button
                                onClick={handleExport}
                                className="text-primary-600 hover:text-primary-700 flex items-center gap-2 font-medium"
                            >
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Add dynamic summary cards based on data */}
                            {activeTab === 'attendance' ? (
                                <>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600 font-medium">Average Attendance</p>
                                        <p className="text-2xl font-bold text-blue-800">
                                            {(reportData.reduce((acc, curr) => acc + parseFloat(curr.attendance_percentage), 0) / reportData.length).toFixed(1)}%
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-green-600 font-medium">Class Average</p>
                                        <p className="text-2xl font-bold text-green-800">
                                            {reportData.length > 0
                                                ? (reportData.reduce((acc, curr) => acc + parseFloat(curr.average_score || 0), 0) / reportData.length).toFixed(1)
                                                : '0'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {Object.keys(reportData[0]).map((key) => (
                                            <th key={key} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                {key.replace(/_/g, ' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            {Object.values(row).map((val: any, i) => (
                                                <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {val}
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
        </DashboardLayout>
    );
};

export default Reports;
