import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI, profileAPI } from '../../services/api';
import { Save, Users, BookOpen } from 'lucide-react';

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
}

interface MarkEntry {
    student_id: number;
    student_name: string;
    roll_number: string;
    marks_obtained: number;
    remarks: string;
}

const TermMarks = () => {
    const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [teacherSubject, setTeacherSubject] = useState<string>('');
    const [selectedTerm, setSelectedTerm] = useState<string>('');

    useEffect(() => {
        fetchTeacherProfile();
        fetchClasses();
    }, []);

    const fetchTeacherProfile = async () => {
        try {
            const response = await profileAPI.getProfile();
            setTeacherSubject(response.data.subject || '');
        } catch (error) {
            console.error('Failed to fetch teacher profile:', error);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await teacherAPI.getMyClasses();
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const handleClassSelect = async (classId: number) => {
        const classData = classes.find((c) => c.id === classId);
        if (!classData) return;

        setSelectedClass(classData);
        setLoading(true);

        try {
            const response = await teacherAPI.getClassStudents(classId);

            // Try to fetch existing term marks
            let existingMarks: any[] = [];
            if (selectedTerm && teacherSubject) {
                try {
                    const marksResponse = await teacherAPI.getTermMarks(
                        classId,
                        selectedTerm,
                        teacherSubject
                    );
                    existingMarks = marksResponse.data;
                } catch (error) {
                    // No existing marks, that's okay
                    console.log('No existing marks found');
                }
            }

            // Initialize mark entries for all students
            const entries = response.data.map((student: Student) => {
                // Check if this student has existing marks
                const existingMark = existingMarks.find(
                    (m: any) => m.student_id === student.id
                );

                return {
                    student_id: student.id,
                    student_name: student.full_name,
                    roll_number: student.roll_number || '',
                    marks_obtained: existingMark ? existingMark.marks : 0,
                    remarks: existingMark ? existingMark.feedback || '' : '',
                };
            });
            setMarkEntries(entries);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId: number, marks: number) => {
        setMarkEntries((prev) =>
            prev.map((entry) =>
                entry.student_id === studentId ? { ...entry, marks_obtained: marks } : entry
            )
        );
    };

    const handleRemarksChange = (studentId: number, remarks: string) => {
        setMarkEntries((prev) =>
            prev.map((entry) =>
                entry.student_id === studentId ? { ...entry, remarks } : entry
            )
        );
    };

    const handleSubmitTermMarks = async () => {
        if (!selectedClass || !selectedTerm || !teacherSubject) {
            alert('Please select class and term');
            return;
        }

        setLoading(true);
        try {
            const response = await profileAPI.getProfile();
            const teacherId = response.data.id;

            const marksData = markEntries.map((entry) => ({
                student_id: entry.student_id,
                teacher_id: teacherId,
                subject: teacherSubject,
                term: selectedTerm,
                marks: entry.marks_obtained,
                feedback: entry.remarks,
            }));

            await teacherAPI.uploadTermMarks(marksData);
            alert('Term marks uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload term marks:', error);
            alert('Failed to upload term marks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Term Marks</h1>
                    <p className="text-gray-600 mt-1">Upload term marks for your classes</p>
                </div>

                {/* Selection Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={teacherSubject}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            />
                            <p className="mt-1 text-xs text-gray-500">From your teacher profile</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Term *
                            </label>
                            <select
                                value={selectedTerm}
                                onChange={(e) => {
                                    setSelectedTerm(e.target.value);
                                    // Reset marks when term changes
                                    setMarkEntries([]);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Choose a term</option>
                                <option value="Term 1">Term 1</option>
                                <option value="Term 2">Term 2</option>
                                <option value="Term 3">Term 3</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Class *
                            </label>
                            <select
                                value={selectedClass?.id || ''}
                                onChange={(e) => handleClassSelect(parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={!selectedTerm}
                            >
                                <option value="">Choose a class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name} ({cls.student_count} students)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Marks Entry Table */}
                {markEntries.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <Users className="text-primary-600" size={24} />
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            Student Marks Entry
                                        </h2>
                                        {markEntries.some(e => e.marks_obtained > 0) && (
                                            <p className="text-sm text-blue-600 mt-1">
                                                ℹ️ Existing marks loaded - you can edit them
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubmitTermMarks}
                                    disabled={loading}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    <span>{loading ? 'Uploading...' : 'Upload Marks'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Roll No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Marks Obtained
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks/Feedback
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {markEntries.map((entry) => (
                                        <tr key={entry.student_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.roll_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {entry.student_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={entry.marks_obtained}
                                                    onChange={(e) =>
                                                        handleMarkChange(
                                                            entry.student_id,
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={entry.remarks}
                                                    onChange={(e) =>
                                                        handleRemarksChange(entry.student_id, e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    placeholder="Optional remarks"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {markEntries.length === 0 && !loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">
                            Select term and class to start uploading marks
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <p className="text-gray-500">Loading...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TermMarks;
