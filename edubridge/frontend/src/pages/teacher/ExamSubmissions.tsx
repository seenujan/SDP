import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { Eye, ArrowLeft, Download } from 'lucide-react';

interface Submission {
    attempt_id: number;
    status: string;
    student_name: string;
    roll_number: string;
    grade: string;
    section: string;
    total_score: number;
    start_time: string;
    end_time: string;
}

const ExamSubmissions = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await teacherAPI.getExamSubmissions(parseInt(id!));
                setSubmissions(response.data);
            } catch (error) {
                console.error('Failed to fetch submissions', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [id]);

    if (loading) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-6">
                <button onClick={() => navigate('/teacher/exams')} className="mb-6 flex items-center text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={16} className="mr-2" /> Back to Exams
                </button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Exam Submissions</h1>
                    <div className="text-sm text-gray-500">
                        Total Submissions: {submissions.length}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {submissions.map((sub) => (
                                <tr key={sub.attempt_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{sub.student_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{sub.roll_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{sub.grade} {sub.section}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.status === 'submitted' ? 'bg-green-100 text-green-800' :
                                                sub.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {sub.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{sub.total_score}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {sub.end_time ? new Date(sub.end_time).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => navigate(`/teacher/exams/review/${sub.attempt_id}`)}
                                            className="text-primary-600 hover:text-primary-900 flex items-center justify-end ml-auto"
                                        >
                                            <Eye size={16} className="mr-1" /> Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No submissions found for this exam yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ExamSubmissions;
