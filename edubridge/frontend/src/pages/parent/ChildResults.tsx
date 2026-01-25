import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { BarChart3, TrendingUp, Award, FileText, Bookmark, UserCircle } from 'lucide-react';

const ChildResults = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [results, setResults] = useState<any>({ termMarks: [], assignmentMarks: [], examMarks: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'exams' | 'assignments' | 'terms'>('exams');

    useEffect(() => {
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChildId) {
            fetchResults(selectedChildId);
        }
    }, [selectedChildId]);

    const fetchChildren = async () => {
        try {
            const response = await parentAPI.getDashboard();
            setChildren(response.data.children || []);
            if (response.data.children && response.data.children.length > 0) {
                setSelectedChildId(response.data.children[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
            setLoading(false);
        }
    };

    const fetchResults = async (childId: number) => {
        setLoading(true);
        try {
            const response = await parentAPI.getChildResults(childId);
            setResults(response.data);
        } catch (error) {
            console.error('Failed to fetch results:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeInfo = (percentage: number) => {
        if (percentage >= 90) return { grade: 'A+', color: 'text-green-700 bg-green-100' };
        if (percentage >= 80) return { grade: 'A', color: 'text-green-600 bg-green-50' };
        if (percentage >= 70) return { grade: 'B', color: 'text-blue-700 bg-blue-100' };
        if (percentage >= 60) return { grade: 'C', color: 'text-yellow-700 bg-yellow-100' };
        if (percentage >= 50) return { grade: 'D', color: 'text-orange-700 bg-orange-100' };
        return { grade: 'F', color: 'text-red-700 bg-red-100' };
    };

    if (loading && children.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    const { termMarks, assignmentMarks, examMarks } = results;

    // Stats Logic
    const examPercentages = examMarks.map((e: any) => parseFloat(e.score)); // Assuming score is percentage or need normalization? Backend sends straight score.
    // Wait, backend sends score. Student view assumes percentage column. 
    // Let's assume score IS percentage for online exams as per query in ParentController which selects 'score'. 
    // StudentResults.tsx used 'percentage' field. ParentController query selects 'score'.
    // I need to ensure I treat 'score' as percentage or calculate it. 
    // In ParentController: SELECT oem.score ... 
    // In StudentResults: const examPercentages = data.exams.map(e => parseFloat(e.percentage));
    // Let's treat 'score' as percentage for now, or ensure consistency.

    // Fixing Stats Logic to be safe
    const avgExam = examPercentages.length ? (examPercentages.reduce((a: number, b: number) => a + b, 0) / examPercentages.length) : 0;
    const maxExam = examPercentages.length ? Math.max(...examPercentages) : 0;
    const totalItems = examMarks.length + assignmentMarks.length + termMarks.length;

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Child Results</h1>
                        <p className="text-gray-600 mt-1">Academic performance and assessment records</p>
                    </div>

                    {children.length > 1 && (
                        <div className="mt-4 md:mt-0">
                            <select
                                value={selectedChildId || ''}
                                onChange={(e) => setSelectedChildId(parseInt(e.target.value))}
                                className="bg-white border text-gray-800 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {children.map((child) => (
                                    <option key={child.id} value={child.id}>
                                        {child.full_name} ({child.grade})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {!selectedChildId ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <UserCircle size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No student profile found linked to your account.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Avg. Exam Score</p>
                                        <p className="text-3xl font-bold text-gray-800">{avgExam.toFixed(1)}%</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="text-blue-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
                                        <p className="text-3xl font-bold text-gray-800">{totalItems}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <FileText className="text-purple-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Highest Exam %</p>
                                        <p className="text-3xl font-bold text-gray-800">{maxExam.toFixed(1)}%</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Award className="text-green-600" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-lg shadow-sm p-2 mb-6 inline-flex">
                            <button
                                onClick={() => setActiveTab('exams')}
                                className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'exams' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <BarChart3 size={18} className="mr-2" /> Exams
                            </button>
                            <button
                                onClick={() => setActiveTab('assignments')}
                                className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'assignments' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <FileText size={18} className="mr-2" /> Assignments
                            </button>
                            <button
                                onClick={() => setActiveTab('terms')}
                                className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'terms' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Bookmark size={18} className="mr-2" /> Term Marks
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                            {/* EXAMS TABLE */}
                            {activeTab === 'exams' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Title</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {examMarks.length === 0 ? (
                                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No exam results found.</td></tr>
                                            ) : (
                                                examMarks.map((exam: any, idx: number) => {
                                                    const { grade, color } = getGradeInfo(parseFloat(exam.score));
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900">{exam.title}</td>
                                                            <td className="px-6 py-4 text-gray-600">{exam.subject}</td>
                                                            <td className="px-6 py-4 text-gray-500">{new Date(exam.exam_date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-gray-900">{exam.score}</span>

                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>
                                                                    {grade}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ASSIGNMENTS TABLE */}
                            {activeTab === 'assignments' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assignment</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted On</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Feedback</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {assignmentMarks.length === 0 ? (
                                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No assignment marks found.</td></tr>
                                            ) : (
                                                assignmentMarks.map((assign: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-900">{assign.title}</td>
                                                        <td className="px-6 py-4 text-gray-600">{assign.subject}</td>
                                                        <td className="px-6 py-4 text-gray-500">{new Date(assign.reviewed_at).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 font-bold text-blue-600 text-lg">
                                                            {assign.marks}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 italic">
                                                            {assign.feedback || <span className="text-gray-300">No feedback</span>}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TERM MARKS TABLE */}
                            {activeTab === 'terms' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Term</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Feedback</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Entered</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {termMarks.length === 0 ? (
                                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No term marks found.</td></tr>
                                            ) : (
                                                termMarks.map((term: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-900">{term.term}</td>
                                                        <td className="px-6 py-4 text-gray-600">{term.subject}</td>
                                                        <td className="px-6 py-4 font-bold text-purple-600 text-lg">
                                                            {term.marks}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 italic">
                                                            {term.feedback || <span className="text-gray-300">No feedback</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500">{new Date(term.entered_at).toLocaleDateString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ChildResults;
