import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { studentAPI } from '../../services/api';
import { FileText, Download, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Assignment {
    id: number;
    title: string;
    description: string;
    subject: string;
    teacher_name: string;
    due_date: string;
    total_marks: number;
    file_url?: string;
    submission_status?: 'submitted' | 'graded' | 'pending';
    submission_date?: string;
    submission_video_url?: string; // This will hold the student's submission file URL
    obtained_marks?: number;
    feedback?: string;
}

const Assignments = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const response = await studentAPI.getAssignments();
            const data = Array.isArray(response.data) ? response.data : [];
            const allAssignments = data.map((a: any) => {
                let status: 'submitted' | 'graded' | 'pending' = 'pending';

                if (a.obtained_marks !== null && a.obtained_marks !== undefined) {
                    status = 'graded';
                } else if (a.submission_status === 'on_time' || a.submission_status === 'late' || a.submission_status === 'submitted') {
                    status = 'submitted';
                }

                return {
                    ...a,
                    file_url: a.assignment_file_url,
                    submission_video_url: a.submission_file_url,
                    submission_status: status
                };
            });
            setAssignments(allAssignments);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'graded':
                return (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
                        <CheckCircle size={14} className="mr-1" />
                        Graded
                    </span>
                );
            case 'submitted':
                return (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center">
                        <Clock size={14} className="mr-1" />
                        Submitted
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        Pending
                    </span>
                );
        }
    };

    const isOverdue = (dueDate: string, status?: string) => {
        return status === 'pending' && new Date(dueDate) < new Date();
    };

    const filteredAssignments = assignments.filter(assignment => {
        if (filter === 'all') return true;
        return assignment.submission_status === filter;
    });

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !submittingId) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            await studentAPI.submitAssignment(submittingId, formData);
            alert('Assignment submitted successfully!');
            fetchAssignments(); // Refresh list to show updated status
        } catch (error) {
            console.error('Failed to submit assignment:', error);
            alert('Failed to submit assignment. Please try again.');
        } finally {
            setSubmittingId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileUpload = (assignmentId: number) => {
        setSubmittingId(assignmentId);
        fileInputRef.current?.click();
    };

    const handleDownload = (fileUrl: string) => {
        // Ensure URL starts with / if it doesn't have http
        const url = fileUrl.startsWith('http') ? fileUrl : `/${fileUrl}`;
        window.open(url, '_blank');
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                />
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Assignments</h1>
                    <p className="text-gray-600 mt-1">View and submit your assignments</p>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All ({assignments.length})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Pending ({assignments.filter(a => a.submission_status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setFilter('submitted')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'submitted' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Submitted ({assignments.filter(a => a.submission_status === 'submitted').length})
                        </button>
                        <button
                            onClick={() => setFilter('graded')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'graded' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Graded ({assignments.filter(a => a.submission_status === 'graded').length})
                        </button>
                    </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                    {filteredAssignments.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">No assignments found</p>
                        </div>
                    ) : (
                        filteredAssignments.map((assignment) => (
                            <div key={assignment.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                            <FileText className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{assignment.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {assignment.subject} • By {assignment.teacher_name}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(assignment.submission_status)}
                                </div>

                                <p className="text-gray-700 mb-4">{assignment.description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-600">Due Date</p>
                                        <p className={`font-semibold ${isOverdue(assignment.due_date, assignment.submission_status)
                                            ? 'text-red-600'
                                            : 'text-gray-800'
                                            }`}>
                                            {new Date(assignment.due_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Total Marks</p>
                                        <p className="font-semibold text-gray-800">{assignment.total_marks}</p>
                                    </div>
                                    {assignment.submission_date && (
                                        <div>
                                            <p className="text-xs text-gray-600">Submitted On</p>
                                            <p className="font-semibold text-gray-800">
                                                {new Date(assignment.submission_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                    {assignment.submission_status === 'graded' && assignment.obtained_marks !== undefined && (
                                        <div>
                                            <p className="text-xs text-gray-600">Score</p>
                                            <p className="font-semibold text-green-600">
                                                {assignment.obtained_marks}/{assignment.total_marks}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {assignment.feedback && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900">Teacher's Feedback:</p>
                                        <p className="text-sm text-blue-800 mt-1">{assignment.feedback}</p>
                                    </div>
                                )}

                                {isOverdue(assignment.due_date, assignment.submission_status) && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                                        <AlertCircle className="text-red-600 mr-2" size={20} />
                                        <p className="text-sm text-red-800 font-medium">This assignment is overdue!</p>
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    {assignment.file_url && (
                                        <button
                                            onClick={() => handleDownload(assignment.file_url!)}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                                        >
                                            <Download size={18} className="mr-2" />
                                            Download Assignment
                                        </button>
                                    )}

                                    {/* View Submission Button */}
                                    {assignment.submission_video_url && (
                                        <button
                                            onClick={() => handleDownload(assignment.submission_video_url!)}
                                            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                                        >
                                            <FileText size={18} className="mr-2" />
                                            My Submission
                                        </button>
                                    )}

                                    {/* Edit / Submit Button */}
                                    {(assignment.submission_status === 'pending' || assignment.submission_status === 'submitted') && (
                                        <button
                                            onClick={() => triggerFileUpload(assignment.id)}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                                        >
                                            <Upload size={18} className="mr-2" />
                                            {assignment.submission_status === 'submitted' ? 'Edit Submission' : 'Submit Assignment'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Assignments;
