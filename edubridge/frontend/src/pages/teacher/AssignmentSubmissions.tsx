import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { FileText, Download, CheckCircle, Clock, User } from 'lucide-react';

interface Submission {
    id: number;
    student_id: number;
    student_name: string;
    grade: string;
    section: string;
    submission_file_url: string;
    submitted_at: string;
    status: 'on_time' | 'late';
    marks: number | null;
    feedback: string | null;
}

const AssignmentSubmissions = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingSubmission, setGradingSubmission] = useState<number | null>(null);
    const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });

    useEffect(() => {
        if (assignmentId) {
            fetchSubmissions();
        }
    }, [assignmentId]);

    const fetchSubmissions = async () => {
        try {
            const response = await teacherAPI.getSubmissions(Number(assignmentId));
            setSubmissions(response.data);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeSubmission = async (submissionId: number) => {
        try {
            await teacherAPI.markSubmission(
                submissionId,
                Number(gradeForm.marks),
                gradeForm.feedback
            );
            alert('Submission graded successfully!');
            setGradingSubmission(null);
            setGradeForm({ marks: '', feedback: '' });
            fetchSubmissions();
        } catch (error) {
            console.error('Failed to grade submission:', error);
            alert('Failed to grade submission. Please try again.');
        }
    };

    const startGrading = (submission: Submission) => {
        setGradingSubmission(submission.id);
        setGradeForm({
            marks: submission.marks?.toString() || '',
            feedback: submission.feedback || ''
        });
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Assignment Submissions</h1>
                    <p className="text-gray-600 mt-1">Review and grade student submissions</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Total Submissions: {submissions.length}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Graded: {submissions.filter(s => s.marks !== null).length} |
                            Pending: {submissions.filter(s => s.marks === null).length}
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading submissions...</p>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">No submissions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {submission.student_name || 'Unknown Student'}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${submission.status === 'on_time'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {submission.status === 'on_time' ? (
                                                        <><CheckCircle size={12} className="inline mr-1" />On Time</>
                                                    ) : (
                                                        <><Clock size={12} className="inline mr-1" />Late</>
                                                    )}
                                                </span>
                                                {submission.marks !== null && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                        Graded: {submission.marks}/100
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <User size={14} className="mr-1" />
                                                    {submission.grade} {submission.section}
                                                </span>
                                                <span>
                                                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const url = submission.submission_file_url.startsWith('http')
                                                    ? submission.submission_file_url
                                                    : `/${submission.submission_file_url}`;
                                                window.open(url, '_blank');
                                            }}
                                            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                                        >
                                            <FileText size={16} className="mr-2" />
                                            Open Submission
                                        </button>
                                    </div>

                                    {gradingSubmission === submission.id ? (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-semibold text-gray-800 mb-3">Grade Submission</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Marks (out of 100)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={gradeForm.marks}
                                                        onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Enter marks"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Feedback
                                                </label>
                                                <textarea
                                                    value={gradeForm.feedback}
                                                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Provide feedback to the student"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleGradeSubmission(submission.id)}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Save Grade
                                                </button>
                                                <button
                                                    onClick={() => setGradingSubmission(null)}
                                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4">
                                            {submission.marks !== null ? (
                                                <div className="p-4 bg-blue-50 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                                        Marks: <span className="text-blue-600 font-bold">{submission.marks}/100</span>
                                                    </p>
                                                    {submission.feedback && (
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            <span className="font-medium">Feedback:</span> {submission.feedback}
                                                        </p>
                                                    )}
                                                    <button
                                                        onClick={() => startGrading(submission)}
                                                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Edit Grade
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startGrading(submission)}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Grade Submission
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AssignmentSubmissions;
