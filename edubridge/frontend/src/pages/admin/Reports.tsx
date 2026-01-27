import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { Download, Filter, FileText, Calendar, Users, Award, MessageSquare } from 'lucide-react';

const Reports = () => {
    const [activeTab, setActiveTab] = useState<'attendance' | 'exam' | 'certificate' | 'scholarship' | 'user' | 'ptm'>('attendance');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);

    // Filters
    const [grades, setGrades] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [certificateTypes, setCertificateTypes] = useState<any[]>([]);

    // Selected Filters
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedCertTypeId, setSelectedCertTypeId] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        setReportData([]);
        // Reset specific filters if needed when tab changes
    }, [activeTab]);

    const fetchMetadata = async () => {
        try {
            const gradesRes = await adminAPI.getGrades();
            setGrades(gradesRes.data);

            const classesRes = await adminAPI.getClasses();
            setClasses(classesRes.data);

            try {
                const certTypesRes = await adminAPI.getCertificateTypes();
                setCertificateTypes(certTypesRes.data);
            } catch (e) { console.error('Cert types fetch failed', e); }
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            let response;
            switch (activeTab) {
                case 'attendance':
                    response = await adminAPI.getAttendanceReport(selectedClassId, startDate, endDate);
                    break;
                case 'exam':
                    response = await adminAPI.getExamReport(selectedGrade, selectedExamId);
                    break;
                case 'certificate':
                    response = await adminAPI.getCertificateReport(selectedCertTypeId, startDate, endDate);
                    break;
                case 'scholarship':
                    response = await adminAPI.getScholarshipReport(startDate, endDate);
                    break;
                case 'user':
                    response = await adminAPI.getUserReport(selectedRole, selectedStatus);
                    break;
                case 'ptm':
                    response = await adminAPI.getPTMFeedbackReport(startDate, endDate);
                    break;
            }
            setReportData(response?.data || []);
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (reportData.length === 0) return;

        const headers = Object.keys(reportData[0]).join(',');
        const rows = reportData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n'); // Add quotes to handle commas in content
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeTab}_report_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs = [
        { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
        { id: 'exam', label: 'Exams', icon: <FileText className="w-4 h-4" /> },
        { id: 'certificate', label: 'Certificates', icon: <Award className="w-4 h-4" /> },
        { id: 'scholarship', label: 'Scholarships', icon: <Award className="w-4 h-4" /> },
        { id: 'user', label: 'Users', icon: <Users className="w-4 h-4" /> },
        { id: 'ptm', label: 'PTM Feedback', icon: <MessageSquare className="w-4 h-4" /> },
    ];

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Reports Center</h1>
                    <p className="text-gray-600 mt-1">Generate and analyze system-wide reports</p>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-2 pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filters Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold border-b pb-2">
                        <Filter className="w-5 h-5" />
                        <h2>Report Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Common Date Filters for most tabs */}
                        {['attendance', 'certificate', 'scholarship', 'ptm'].includes(activeTab) && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'attendance' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
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
                        )}

                        {activeTab === 'exam' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                    <select
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
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
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        placeholder="Ex: 10"
                                        value={selectedExamId}
                                        onChange={(e) => setSelectedExamId(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'certificate' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                                <select
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                    value={selectedCertTypeId}
                                    onChange={(e) => setSelectedCertTypeId(e.target.value)}
                                >
                                    <option value="">All Types</option>
                                    {certificateTypes.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {activeTab === 'user' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        <option value="">All Roles</option>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="parent">Parent</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="col-span-1 md:col-span-4 flex justify-end mt-2">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
                            >
                                {loading ? 'Generating...' : <><FileText className="w-5 h-5" /> Generate Report</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {reportData.length > 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                Report Results <span className="text-gray-400 text-sm font-normal">({reportData.length} records)</span>
                            </h2>
                            <button
                                onClick={handleExport}
                                className="text-primary-600 hover:text-primary-700 flex items-center gap-2 font-medium bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
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
                ) : (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No report data generated yet. Adjust filters and click "Generate Report".</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Reports;
