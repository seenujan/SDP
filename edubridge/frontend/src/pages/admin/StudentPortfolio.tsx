import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { User, Save, FileText, Edit, Trash2, X, Filter } from 'lucide-react';

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
    class_name: string;
    grade: string;
    section: string;
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
    const [grades, setGrades] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingEntry, setEditingEntry] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<PortfolioEntry>>({});

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        try {
            const response = await adminAPI.getGrades();
            setGrades(response.data);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
        }
    };

    const handleGradeChange = async (grade: string) => {
        setSelectedGrade(grade);
        setSelectedSection('');
        setStudents([]);
        setSelectedStudent(null);
        setPortfolioEntries([]);

        if (grade) {
            try {
                const response = await adminAPI.getSectionsForGrade(grade);
                setSections(response.data);
            } catch (error) {
                console.error('Failed to fetch sections:', error);
            }
        } else {
            setSections([]);
        }
    };

    const handleSectionChange = async (section: string) => {
        setSelectedSection(section);
        setSelectedStudent(null);
        setPortfolioEntries([]);

        // Auto-load students when both grade and section are selected
        if (selectedGrade && section) {
            setLoading(true);
            try {
                const response = await adminAPI.getStudentsByFilter(selectedGrade, section);
                setStudents(response.data);
            } catch (error) {
                console.error('Failed to fetch students:', error);
                setStudents([]);
            } finally {
                setLoading(false);
            }
        } else {
            setStudents([]);
        }
    };

    const handleStudentSelect = async (student: Student) => {
        setSelectedStudent(student);
        setLoading(true);

        try {
            const response = await adminAPI.getStudentPortfolio(student.id);
            setPortfolioEntries(response.data.portfolioEntries || []);
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
            setPortfolioEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const startEditEntry = (entry: PortfolioEntry) => {
        setEditingEntry(entry.id);
        setEditFormData({
            performance_summary: entry.performance_summary,
            activities_achievements: entry.activities_achievements,
            areas_improvement: entry.areas_improvement,
            teacher_remarks: entry.teacher_remarks,
        });
    };

    const cancelEdit = () => {
        setEditingEntry(null);
        setEditFormData({});
    };

    const saveEdit = async (entryId: number) => {
        try {
            await adminAPI.updatePortfolioEntry(entryId, {
                performanceSummary: editFormData.performance_summary,
                activitiesAchievements: editFormData.activities_achievements,
                areasImprovement: editFormData.areas_improvement,
                teacherRemarks: editFormData.teacher_remarks,
            });

            alert('Portfolio entry updated successfully!');

            // Reload portfolio
            if (selectedStudent) {
                const response = await adminAPI.getStudentPortfolio(selectedStudent.id);
                setPortfolioEntries(response.data.portfolioEntries || []);
            }

            setEditingEntry(null);
            setEditFormData({});
        } catch (error) {
            console.error('Failed to update entry:', error);
            alert('Failed to update entry. Please try again.');
        }
    };

    const deleteEntry = async (entryId: number) => {
        if (!confirm('Are you sure you want to delete this portfolio entry?')) {
            return;
        }

        try {
            await adminAPI.deletePortfolioEntry(entryId);
            alert('Portfolio entry deleted successfully!');

            // Reload portfolio
            if (selectedStudent) {
                const response = await adminAPI.getStudentPortfolio(selectedStudent.id);
                setPortfolioEntries(response.data.portfolioEntries || []);
            }
        } catch (error) {
            console.error('Failed to delete entry:', error);
            alert('Failed to delete entry. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Student Portfolio Management</h1>
                    <p className="text-gray-600 mt-1">View and manage student portfolio records</p>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Filter className="mr-2" size={20} />
                        Filter Students
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Grade *
                            </label>
                            <select
                                value={selectedGrade}
                                onChange={(e) => handleGradeChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Choose grade</option>
                                {grades.map((g) => (
                                    <option key={g.grade} value={g.grade}>
                                        {g.grade}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Section *
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                disabled={!selectedGrade}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="">Choose section</option>
                                {sections.map((s) => (
                                    <option key={s.section} value={s.section}>
                                        {s.section}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Student
                            </label>
                            <select
                                value={selectedStudent?.id || ''}
                                onChange={(e) => {
                                    const student = students.find((s) => s.id === parseInt(e.target.value));
                                    if (student) handleStudentSelect(student);
                                }}
                                disabled={students.length === 0}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="">Choose student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.roll_number} - {student.full_name}
                                    </option>
                                ))}
                            </select>
                            {loading && students.length === 0 && (
                                <p className="text-sm text-gray-500 mt-1">Loading students...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Student Info */}
                {selectedStudent && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="text-primary-600" size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.full_name}</h2>
                                <p className="text-gray-600">
                                    Roll No: {selectedStudent.roll_number} • {selectedStudent.class_name}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Portfolio Entries: {portfolioEntries.length}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Portfolio Entries */}
                {selectedStudent && portfolioEntries.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <FileText className="mr-2" size={20} />
                            Portfolio Entries ({portfolioEntries.length})
                        </h3>
                        <div className="space-y-4">
                            {portfolioEntries.map((entry, idx) => (
                                <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">
                                                Entry #{portfolioEntries.length - idx}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                By {entry.teacher_name} • {new Date(entry.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {editingEntry !== entry.id && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => startEditEntry(entry)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteEntry(entry.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editingEntry === entry.id ? (
                                        // Edit Mode
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Performance Summary
                                                </label>
                                                <textarea
                                                    value={editFormData.performance_summary || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, performance_summary: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Activities & Achievements
                                                </label>
                                                <textarea
                                                    value={editFormData.activities_achievements || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, activities_achievements: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Areas for Improvement
                                                </label>
                                                <textarea
                                                    value={editFormData.areas_improvement || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, areas_improvement: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Teacher Remarks
                                                </label>
                                                <textarea
                                                    value={editFormData.teacher_remarks || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, teacher_remarks: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div className="flex space-x-2 justify-end">
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                                                >
                                                    <X size={18} className="mr-1" />
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => saveEdit(entry.id)}
                                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                                                >
                                                    <Save size={18} className="mr-1" />
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <>
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
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {selectedStudent && portfolioEntries.length === 0 && !loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No portfolio entries found for this student</p>
                    </div>
                )}

                {/* Loading */}
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
