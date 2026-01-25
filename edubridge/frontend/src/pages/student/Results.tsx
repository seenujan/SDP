import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { studentAPI } from '../../services/api';
import { TrendingUp, Award, BarChart3, FileText, Bookmark } from 'lucide-react';

const Results = () => {
    const [data, setData] = useState<{ exams: any[], assignments: any[], terms: any[] }>({
        exams: [],
        assignments: [],
        terms: []
    });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'exams' | 'assignments' | 'terms'>('exams');

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await studentAPI.getResults();
            setData(response.data);
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

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading results...</p>
                </div>
            </DashboardLayout>
        );
    }

    // Stats Logic - Only for Exams since they have percentages
    const examPercentages = data.exams.map(e => parseFloat(e.percentage));
    const avgExam = examPercentages.length ? (examPercentages.reduce((a, b) => a + b, 0) / examPercentages.length) : 0;
    const maxExam = examPercentages.length ? Math.max(...examPercentages) : 0;
    const totalItems = data.exams.length + data.assignments.length + data.terms.length;

    return (
        <DashboardLayout>
            <div className="animate-fade-in p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Academic Results</h1>
                    <p className="text-gray-600 mt-1">View your performance across all assessments</p>
                </div>

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
                        onClick={() => setTab('exams')}
                        className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${tab === 'exams' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <BarChart3 size={18} className="mr-2" /> Exams
                    </button>
                    <button
                        onClick={() => setTab('assignments')}
                        className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${tab === 'assignments' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FileText size={18} className="mr-2" /> Assignments
                    </button>
                    <button
                        onClick={() => setTab('terms')}
                        className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${tab === 'terms' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Bookmark size={18} className="mr-2" /> Term Marks
                    </button>
                </div>

                {/* Data Tables */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[400px]">

                    {/* EXAMS TABLE */}
                    {tab === 'exams' && (
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
                                    {data.exams.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No exam results found.</td></tr>
                                    ) : (
                                        data.exams.map((exam: any) => {
                                            const { grade, color } = getGradeInfo(parseFloat(exam.percentage));
                                            return (
                                                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{exam.exam_title}</td>
                                                    <td className="px-6 py-4 text-gray-600">{exam.subject}</td>
                                                    <td className="px-6 py-4 text-gray-500">{new Date(exam.exam_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900">{exam.obtained_marks} / {exam.total_marks}</span>
                                                            <span className="text-xs text-gray-500">{exam.percentage}%</span>
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
                    {tab === 'assignments' && (
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
                                    {data.assignments.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No assignment marks found.</td></tr>
                                    ) : (
                                        data.assignments.map((assign: any) => (
                                            <tr key={assign.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{assign.assignment_title}</td>
                                                <td className="px-6 py-4 text-gray-600">{assign.subject}</td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(assign.submitted_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-bold text-blue-600 text-lg">
                                                    {assign.obtained_marks}
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
                    {tab === 'terms' && (
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
                                    {data.terms.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No term marks found.</td></tr>
                                    ) : (
                                        data.terms.map((term: any) => (
                                            <tr key={term.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{term.term}</td>
                                                <td className="px-6 py-4 text-gray-600">{term.subject}</td>
                                                <td className="px-6 py-4 font-bold text-purple-600 text-lg">
                                                    {term.obtained_marks}
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
            </div>
        </DashboardLayout>
    );
};

export default Results;
