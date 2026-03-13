import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { UserCircle, TrendingUp, Award, BookOpen, Clock } from 'lucide-react';

const ViewProgress = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [selectedTerm, setSelectedTerm] = useState('Term 1');
    const [progressData, setProgressData] = useState<any>(null);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const terms = ['Term 1', 'Term 2', 'Term 3'];

    useEffect(() => {
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchProgress(selectedChild.id);
            fetchSummary(selectedChild.id, selectedTerm);
        }
    }, [selectedChild, selectedTerm]);

    const fetchChildren = async () => {
        try {
            const response = await parentAPI.getDashboard();
            setChildren(response.data.children || []);
            if (response.data.children && response.data.children.length > 0) {
                setSelectedChild(response.data.children[0]);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
            setLoading(false);
        }
    };

    const fetchProgress = async (childId: number) => {
        try {
            const response = await parentAPI.getChildProgress(childId);
            setProgressData(response.data);
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        }
    };

    const fetchSummary = async (childId: number, term: string) => {
        setLoading(true);
        try {
            const response = await parentAPI.getChildProgressCard(childId, term);
            setSummaryData(response.data);
        } catch (error) {
            console.error('Failed to fetch summary:', error);
            setSummaryData(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedChild) {
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
            <div className="animate-fade-in space-y-6 pb-12">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Student Progress</h1>
                        <p className="text-gray-600 mt-1">Track comprehensive academic and attendance growth</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Term Selector */}
                        <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="bg-white border text-gray-800 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            {terms.map((term) => (
                                <option key={term} value={term}>
                                    {term}
                                </option>
                            ))}
                        </select>

                        {/* Child Selector */}
                        {children.length > 1 && (
                            <select
                                value={selectedChild?.id}
                                onChange={(e) => {
                                    const child = children.find(c => c.id === parseInt(e.target.value));
                                    setSelectedChild(child);
                                }}
                                className="bg-white border text-gray-800 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                {children.map((child) => (
                                    <option key={child.id} value={child.id}>
                                        {child.full_name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {selectedChild && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-6">
                        <div className="bg-primary-50 p-3 rounded-full">
                            <UserCircle size={48} className="text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedChild.full_name}</h2>
                            <p className="text-gray-500">Grade {selectedChild.grade} • {selectedChild.section}</p>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                {summaryData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Marks</p>
                                <p className="text-2xl font-bold">{summaryData.summary.total_marks}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="bg-green-50 p-3 rounded-lg text-green-600">
                                <Award size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average</p>
                                <p className="text-2xl font-bold">{summaryData.summary.average}%</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                                <Award size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Class Rank</p>
                                <p className="text-2xl font-bold">{summaryData.summary.term_rank}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Attendance</p>
                                <p className="text-2xl font-bold">{summaryData.summary.attendance_percentage}%</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subject-wise Marks Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <BookOpen className="mr-2 text-primary-600" size={24} />
                                {selectedTerm} Progress Summary
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4 text-center">Term Mark (80%)</th>
                                        <th className="px-6 py-4 text-center">CA Mark (20%)</th>
                                        <th className="px-6 py-4 text-center">Final Mark</th>
                                        <th className="px-6 py-4 text-center">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summaryData?.marks && summaryData.marks.length > 0 ? (
                                        summaryData.marks.map((mark: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-800">{mark.subject_name}</td>
                                                <td className="px-6 py-4 text-center text-gray-600">{mark.term_mark}</td>
                                                <td className="px-6 py-4 text-center text-gray-600">{mark.ca_mark}%</td>
                                                <td className="px-6 py-4 text-center font-bold text-primary-600">{mark.total_mark}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-md text-sm font-bold ${mark.grade === 'A' ? 'bg-green-100 text-green-700' :
                                                        mark.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                            mark.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {mark.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                                                No marks recorded for this term yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Assignment Activity (Original view but tightened) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                <TrendingUp className="mr-2 text-primary-600" size={20} />
                                Recent Assignments
                            </h2>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[600px] flex-grow">
                            <div className="space-y-6">
                                {progressData?.submissions && progressData.submissions.length > 0 ? (
                                    progressData.submissions.slice(0, 10).map((submission: any) => (
                                        <div key={submission.id} className="relative pl-6 border-l-2 border-primary-100 pb-2">
                                            <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border-2 border-primary-500">
                                                <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 text-sm">{submission.assignment_title}</h4>
                                                    <p className="text-xs text-gray-600">{submission.subject}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(submission.submitted_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-primary-600">
                                                        {submission.marks ? `${submission.marks}%` : 'Pending'}
                                                    </div>
                                                </div>
                                            </div>
                                            {submission.feedback && (
                                                <div className="mt-2 bg-gray-50 p-2 rounded text-[11px] text-gray-600 italic">
                                                    "{submission.feedback}"
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm italic py-4">No recent assignment activity.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ViewProgress;

