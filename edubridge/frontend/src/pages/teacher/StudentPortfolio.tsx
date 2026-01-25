import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { User, Save, FileText, AlertCircle } from 'lucide-react';

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
    class_name: string;
}

interface PortfolioEntry {
    id: number;
    performance_summary: string;
    activities_achievements: string;
    areas_improvement: string;
    teacher_remarks: string;
    created_at: string;
    teacher_name: string;
}

const StudentPortfolio = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        performanceSummary: '',
        activitiesAchievements: '',
        areasImprovement: '',
        teacherRemarks: ''
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await teacherAPI.getMyClasses();
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const handleClassSelect = async (classId: number) => {
        setSelectedStudent(null);
        setPortfolioEntries([]);
        resetForm();
        setLoading(true);

        try {
            const response = await teacherAPI.getClassStudents(classId);
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelect = async (student: Student) => {
        setSelectedStudent(student);
        setLoading(true);
        resetForm();

        try {
            const response = await teacherAPI.getStudentPortfolio(student.id);
            setPortfolioEntries(response.data.portfolioEntries || []);
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
            setPortfolioEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            performanceSummary: '',
            activitiesAchievements: '',
            areasImprovement: '',
            teacherRemarks: ''
        });
    };

    const handleSavePortfolio = async () => {
        if (!selectedStudent) {
            alert('Please select a student');
            return;
        }

        setSaving(true);
        try {
            await teacherAPI.addPortfolioEntry({
                studentId: selectedStudent.id,
                ...formData
            });

            alert('Portfolio entry saved successfully!');

            // Reload portfolio entries
            const response = await teacherAPI.getStudentPortfolio(selectedStudent.id);
            setPortfolioEntries(response.data.portfolioEntries || []);

            // Reset form
            resetForm();
        } catch (error) {
            console.error('Failed to save portfolio:', error);
            alert('Failed to save portfolio. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Student Portfolio</h1>
                    <p className="text-gray-600 mt-1">Update student portfolio and performance records</p>
                </div>

                {/* Selection Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Class *
                            </label>
                            <select
                                onChange={(e) => handleClassSelect(parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Choose a class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name} ({cls.student_count} students)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {students.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Student *
                                </label>
                                <select
                                    onChange={(e) => {
                                        const student = students.find((s) => s.id === parseInt(e.target.value));
                                        if (student) handleStudentSelect(student);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Choose a student</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.roll_number} - {student.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Portfolio Form */}
                {selectedStudent && (
                    <div className="space-y-6">
                        {/* Student Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                    <User className="text-primary-600" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.full_name}</h2>
                                    <p className="text-gray-600">
                                        Roll No: {selectedStudent.roll_number} • {selectedStudent.class_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Entry Form */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">Add Portfolio Entry</h3>
                                <button
                                    onClick={handleSavePortfolio}
                                    disabled={saving}
                                    className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                                >
                                    <Save size={18} className="mr-2" />
                                    {saving ? 'Saving...' : 'Save Portfolio'}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Performance Summary */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Performance Summary
                                    </label>
                                    <textarea
                                        value={formData.performanceSummary}
                                        onChange={(e) => setFormData({ ...formData, performanceSummary: e.target.value })}
                                        rows={3}
                                        placeholder="Describe the student's overall performance and understanding..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Activities & Achievements */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Activities & Achievements
                                    </label>
                                    <textarea
                                        value={formData.activitiesAchievements}
                                        onChange={(e) => setFormData({ ...formData, activitiesAchievements: e.target.value })}
                                        rows={4}
                                        placeholder="- Won 1st in Inter-School Mathematics Competition&#10;- Member of Science Club&#10;- Completed algebra project with distinction"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Use bullet points with dashes (-) for each item</p>
                                </div>

                                {/* Areas for Improvement */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Areas for Improvement
                                    </label>
                                    <textarea
                                        value={formData.areasImprovement}
                                        onChange={(e) => setFormData({ ...formData, areasImprovement: e.target.value })}
                                        rows={3}
                                        placeholder="Needs more practice in geometry and spatial reasoning..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Teacher Remarks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teacher Remarks
                                    </label>
                                    <textarea
                                        value={formData.teacherRemarks}
                                        onChange={(e) => setFormData({ ...formData, teacherRemarks: e.target.value })}
                                        rows={3}
                                        placeholder="Highly motivated student. Recommended for advanced mathematics stream..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Previous Entries */}
                        {portfolioEntries.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                    <FileText className="mr-2" size={20} />
                                    Previous Portfolio Entries
                                </h3>
                                <div className="space-y-4">
                                    {portfolioEntries.map((entry, idx) => (
                                        <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Entry #{portfolioEntries.length - idx}</p>
                                                    <p className="text-xs text-gray-500">
                                                        By {entry.teacher_name} • {new Date(entry.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    Read-only
                                                </span>
                                            </div>

                                            {entry.performance_summary && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700">Performance Summary:</p>
                                                    <p className="text-sm text-gray-600">{entry.performance_summary}</p>
                                                </div>
                                            )}

                                            {entry.activities_achievements && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700">Activities & Achievements:</p>
                                                    <p className="text-sm text-gray-600 whitespace-pre-line">{entry.activities_achievements}</p>
                                                </div>
                                            )}

                                            {entry.areas_improvement && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700">Areas for Improvement:</p>
                                                    <p className="text-sm text-gray-600">{entry.areas_improvement}</p>
                                                </div>
                                            )}

                                            {entry.teacher_remarks && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Teacher Remarks:</p>
                                                    <p className="text-sm text-gray-600">{entry.teacher_remarks}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!selectedStudent && !loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">Select a class and student to manage their portfolio</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <p className="text-gray-500">Loading...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentPortfolio;
