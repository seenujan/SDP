import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { FileText, Plus, Users, Calendar, Eye } from 'lucide-react';
import { Assignment } from '../../types';

const Assignments = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subjectId: '',
        classId: '',
        dueDate: ''
    });
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const [assignmentsRes, classesRes, subjectsRes] = await Promise.all([
                teacherAPI.getMyAssignments(),
                teacherAPI.getMyClasses(),
                teacherAPI.getAllSubjects()
            ]);
            setAssignments(assignmentsRes.data);
            setClasses(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        setCreating(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('subjectId', formData.subjectId);
            formDataToSend.append('classId', formData.classId);
            formDataToSend.append('dueDate', formData.dueDate);
            formDataToSend.append('file', selectedFile);

            await teacherAPI.createAssignment(formDataToSend);
            alert('Assignment created successfully!');
            setShowCreateForm(false);
            setFormData({
                title: '',
                description: '',
                subjectId: '',
                classId: '',
                dueDate: ''
            });
            setSelectedFile(null);
            fetchAssignments();
        } catch (error) {
            console.error('Failed to create assignment:', error);
            alert('Failed to create assignment. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleViewSubmissions = (assignmentId: number) => {
        navigate(`/teacher/assignments/${assignmentId}/submissions`);
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Assignments</h1>
                        <p className="text-gray-600 mt-1">Create and manage assignments</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        Create Assignment
                    </button>
                </div>

                {/* Create Assignment Form */}
                {showCreateForm && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Assignment</h2>
                        <form onSubmit={handleCreateAssignment}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Assignment title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subject *
                                    </label>
                                    <select
                                        required
                                        value={formData.subjectId}
                                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select subject</option>
                                        {subjects.map((sub: any) => (
                                            <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Class *
                                    </label>
                                    <select
                                        required
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select class</option>
                                        {classes.map((cls: any) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.grade} - {cls.section}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Assignment description and instructions"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assignment File *
                                </label>
                                <input
                                    type="file"
                                    required
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {selectedFile && (
                                    <p className="mt-2 text-sm text-green-600">
                                        Selected: {selectedFile.name}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP (Max: 10MB)
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                >
                                    {creating ? 'Creating...' : 'Create Assignment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Assignments List */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">All Assignments</h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading assignments...</p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">No assignments created yet</p>
                            <p className="text-gray-400 text-sm mt-2">Click "Create Assignment" to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                                {assignment.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {assignment.description}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <FileText size={14} className="mr-1" />
                                                    {assignment.subject}
                                                </span>
                                                <span className="flex items-center">
                                                    <Users size={14} className="mr-1" />
                                                    {assignment.grade} - {assignment.section}
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar size={14} className="mr-1" />
                                                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <div className="mb-3">
                                                <span className="text-2xl font-bold text-blue-600">
                                                    {assignment.submission_count}
                                                </span>
                                                <p className="text-xs text-gray-500">Submissions</p>
                                            </div>
                                            <button
                                                onClick={() => handleViewSubmissions(assignment.id)}
                                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                <Eye size={16} className="mr-1" />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Assignments;
