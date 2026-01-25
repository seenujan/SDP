import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { FileText, Download, User } from 'lucide-react';
import jsPDF from 'jspdf';

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
    class_name: string;
    grade: string;
    section: string;
}

interface ProgressCardData {
    student: {
        id: number;
        full_name: string;
        roll_number: string;
        class_name: string;
        email: string;
    };
    portfolio: Array<{
        performance_summary: string;
        activities_achievements: string;
        areas_improvement: string;
        teacher_remarks: string;
        teacher_name: string;
        created_at: string;
    }>;
    marks: any[];
    attendance: any;
}

const ProgressCard = () => {
    const [grades, setGrades] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [progressData, setProgressData] = useState<ProgressCardData | null>(null);
    const [loading, setLoading] = useState(false);

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
        setProgressData(null);

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
        setProgressData(null);

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
            const response = await adminAPI.getProgressCardData(student.id);
            setProgressData(response.data);
        } catch (error) {
            console.error('Failed to fetch progress data:', error);
            setProgressData(null);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        if (!selectedStudent || !progressData) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('EduBridge School Management System', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.text('Student Progress Card', pageWidth / 2, 30, { align: 'center' });

        // Student Info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Student Name: ${progressData.student.full_name}`, 20, 45);
        doc.text(`Roll Number: ${progressData.student.roll_number}`, 20, 52);
        doc.text(`Class: ${progressData.student.class_name}`, 20, 59);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 66);

        let yPosition = 80;

        // Portfolio Section
        if (progressData.portfolio && progressData.portfolio.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Portfolio Summary', 20, yPosition);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const latestEntry = progressData.portfolio[0];

            if (latestEntry.performance_summary) {
                doc.text('Performance Summary:', 20, yPosition);
                yPosition += 5;
                const splitSummary = doc.splitTextToSize(latestEntry.performance_summary, pageWidth - 40);
                doc.text(splitSummary, 25, yPosition);
                yPosition += splitSummary.length * 5 + 5;
            }

            if (latestEntry.activities_achievements) {
                doc.text('Activities & Achievements:', 20, yPosition);
                yPosition += 5;
                const splitActivities = doc.splitTextToSize(latestEntry.activities_achievements, pageWidth - 40);
                doc.text(splitActivities, 25, yPosition);
                yPosition += splitActivities.length * 5 + 5;
            }

            if (latestEntry.areas_improvement) {
                doc.text('Areas for Improvement:', 20, yPosition);
                yPosition += 5;
                const splitAreas = doc.splitTextToSize(latestEntry.areas_improvement, pageWidth - 40);
                doc.text(splitAreas, 25, yPosition);
                yPosition += splitAreas.length * 5 + 5;
            }

            if (latestEntry.teacher_remarks) {
                doc.text('Teacher Remarks:', 20, yPosition);
                yPosition += 5;
                const splitRemarks = doc.splitTextToSize(latestEntry.teacher_remarks, pageWidth - 40);
                doc.text(splitRemarks, 25, yPosition);
                yPosition += splitRemarks.length * 5 + 10;
            }

            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(
                `Prepared by: ${latestEntry.teacher_name} on ${new Date(latestEntry.created_at).toLocaleDateString()}`,
                20,
                yPosition
            );
        }

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('This is a computer-generated document', pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });

        // Save PDF
        doc.save(`Progress_Card_${progressData.student.roll_number}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Progress Card Generation</h1>
                    <p className="text-gray-600 mt-1">Generate comprehensive student progress reports</p>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FileText className="mr-2" size={20} />
                        Select Student
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

                {/* Progress Card Preview */}
                {selectedStudent && progressData && (
                    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Progress Card</h2>
                                <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={generatePDF}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                            >
                                <Download size={20} className="mr-2" />
                                Download PDF
                            </button>
                        </div>

                        {/* Student Info */}
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                    <User className="text-primary-600" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{progressData.student.full_name}</h3>
                                    <p className="text-gray-600">
                                        Roll No: {progressData.student.roll_number} • Class: {progressData.student.class_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Summary */}
                        {progressData.portfolio && progressData.portfolio.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Summary</h3>
                                <div className="space-y-4">
                                    {progressData.portfolio[0].performance_summary && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Performance Summary</p>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                                {progressData.portfolio[0].performance_summary}
                                            </p>
                                        </div>
                                    )}

                                    {progressData.portfolio[0].activities_achievements && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Activities & Achievements</p>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-line">
                                                {progressData.portfolio[0].activities_achievements}
                                            </p>
                                        </div>
                                    )}

                                    {progressData.portfolio[0].areas_improvement && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Areas for Improvement</p>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                                {progressData.portfolio[0].areas_improvement}
                                            </p>
                                        </div>
                                    )}

                                    {progressData.portfolio[0].teacher_remarks && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Teacher Remarks</p>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                                {progressData.portfolio[0].teacher_remarks}
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500 italic mt-4">
                                        Prepared by: {progressData.portfolio[0].teacher_name} on{' '}
                                        {new Date(progressData.portfolio[0].created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* No Data Message */}
                        {progressData.portfolio.length === 0 && (
                            <div className="text-center py-8">
                                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">No portfolio data available for this student</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!selectedStudent && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">Select a student to view their progress card</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <p className="text-gray-500">Loading progress data...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ProgressCard;
