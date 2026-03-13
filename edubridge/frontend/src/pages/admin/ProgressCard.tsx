import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { FileText, Download, User, Award, Percent, Hash } from 'lucide-react';
import jsPDF from 'jspdf';

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
    class_name: string;
    grade: string;
    section: string;
}

interface MarkEntry {
    subject_name: string;
    term_mark: number;
    ca_mark: number;
    total_mark: number;
    grade: string;
}

interface ProgressCardData {
    student: {
        id: number;
        full_name: string;
        roll_number: string;
        class_name: string;
        email: string;
    };
    marks: MarkEntry[];
    summary: {
        total_marks: number;
        average: number;
        term_rank: string | number;
        attendance_percentage: number;
    };
}

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

const ProgressCard = () => {
    const [grades, setGrades] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);

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
        fetchProgressData(student, selectedTerm);
    };

    const handleTermChange = (term: string) => {
        setSelectedTerm(term);
        if (selectedStudent) {
            fetchProgressData(selectedStudent, term);
        }
    };

    const fetchProgressData = async (student: Student, term: string) => {
        setLoading(true);
        try {
            const response = await adminAPI.getProgressCardData(student.id, term);
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
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('EduBridge School', pageWidth / 2, 25, { align: 'center' });

        doc.setFontSize(16);
        doc.text('Student Progress Report', pageWidth / 2, 35, { align: 'center' });

        // Term Background Header
        doc.setFillColor(230, 240, 255);
        doc.rect(20, 45, pageWidth - 40, 10, 'F');
        doc.setFontSize(14);
        doc.setTextColor(30, 60, 120);
        doc.text(`${selectedTerm} Examination`, pageWidth / 2, 52, { align: 'center' });

        // Student Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        doc.text(`Student Name : ${progressData.student.full_name}`, 20, 70);
        doc.text(`Class             : ${progressData.student.class_name}`, 20, 78);
        doc.text(`Roll Number   : ${progressData.student.roll_number}`, 120, 70);
        doc.text(`Date              : ${new Date().toLocaleDateString()}`, 120, 78);

        // Divider
        doc.setLineWidth(0.5);
        doc.line(20, 85, pageWidth - 20, 85);

        let yPosition = 95;

        // Marks Table Header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        doc.text('Subject', 25, yPosition + 1);
        doc.text('CA Mark', 90, yPosition + 1);
        doc.text('Term Mark', 120, yPosition + 1);
        doc.text('Final Mark', 150, yPosition + 1);
        doc.text('Grade', 180, yPosition + 1);

        yPosition += 15;
        doc.setFont('helvetica', 'normal');

        // Marks Table Rows
        if (progressData.marks && progressData.marks.length > 0) {
            progressData.marks.forEach(mark => {
                doc.text(mark.subject_name.substring(0, 25), 25, yPosition);
                doc.text(mark.ca_mark.toString(), 95, yPosition);
                doc.text(mark.term_mark.toString(), 125, yPosition);
                doc.setFont('helvetica', 'bold');
                doc.text(mark.total_mark.toString(), 155, yPosition);
                doc.text(mark.grade, 185, yPosition);
                doc.setFont('helvetica', 'normal');

                // Light line between rows
                doc.setDrawColor(220, 220, 220);
                doc.line(20, yPosition + 3, pageWidth - 20, yPosition + 3);

                yPosition += 10;
            });
        } else {
            doc.text('No marks available for this term.', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
        }

        yPosition += 10;

        // Summary Statistics Box
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.rect(20, yPosition, pageWidth - 40, 25);

        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 25, yPosition + 8);
        doc.setFont('helvetica', 'normal');

        doc.text(`Total Marks: ${progressData.summary.total_marks}`, 25, yPosition + 18);
        doc.text(`Average: ${progressData.summary.average}%`, 80, yPosition + 18);
        doc.text(`Term Rank: ${progressData.summary.term_rank}`, 130, yPosition + 18);
        doc.text(`Attendance: ${progressData.summary.attendance_percentage}%`, 25, yPosition + 35); // moved outside box

        // Footer signatures
        yPosition += 60;
        doc.setLineWidth(0.5);
        doc.line(30, yPosition, 80, yPosition);
        doc.line(pageWidth - 80, yPosition, pageWidth - 30, yPosition);

        doc.setFontSize(10);
        doc.text('Class Teacher Signature', 55, yPosition + 5, { align: 'center' });
        doc.text('Principal Signature', pageWidth - 55, yPosition + 5, { align: 'center' });

        // Footer tag
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('This is a computer-generated document', pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });

        // Save PDF
        doc.save(`ProgressCard_${progressData.student.roll_number}_${selectedTerm.replace(' ', '')}.pdf`);
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Progress Card Generation</h1>
                    <p className="text-gray-600 mt-1">Generate comprehensive student progress reports</p>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FileText className="mr-2 text-primary-600" size={20} />
                        Report Selection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Term *</label>
                            <select
                                value={selectedTerm}
                                onChange={(e) => handleTermChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {TERMS.map(term => (
                                    <option key={term} value={term}>{term}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Grade *</label>
                            <select
                                value={selectedGrade}
                                onChange={(e) => handleGradeChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Choose grade</option>
                                {grades.map((g) => (
                                    <option key={g.grade} value={g.grade}>{g.grade}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                disabled={!selectedGrade}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="">Choose section</option>
                                {sections.map((s) => (
                                    <option key={s.section} value={s.section}>{s.section}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
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
                                <p className="text-sm text-gray-500 mt-1">Loading...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Card Preview */}
                {selectedStudent && progressData && !loading && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">

                        {/* Report Header */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Progress Report</h2>
                                <p className="text-primary-100 text-lg opacity-90">{selectedTerm} Examination</p>
                            </div>
                            <button
                                onClick={generatePDF}
                                className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm"
                            >
                                <Download size={20} className="mr-2" />
                                Download PDF
                            </button>
                        </div>

                        <div className="p-8">
                            {/* Student Profile Ribbon */}
                            <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-xl mb-8 border border-gray-100">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                    <User className="text-primary-600" size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{progressData.student.full_name}</h3>
                                    <div className="flex items-center mt-2 space-x-4 text-gray-600">
                                        <span className="flex items-center"><Hash size={16} className="mr-1" /> {progressData.student.roll_number}</span>
                                        <span>•</span>
                                        <span className="font-medium px-3 py-1 bg-white rounded-full shadow-sm text-sm border border-gray-100">
                                            {progressData.student.class_name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Marks Table */}
                            <div className="mb-10">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Academic Performance</h3>
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">CA Component</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Term Exam</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider bg-primary-50">Total Mark</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {progressData.marks.length > 0 ? (
                                                progressData.marks.map((mark, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mark.subject_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{mark.ca_mark}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{mark.term_mark}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-800 bg-gray-50 border-x border-gray-100">{mark.total_mark}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full
                                                                ${mark.grade === 'A' ? 'bg-green-100 text-green-800' :
                                                                    mark.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                                                        mark.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                                                            mark.grade === 'S' ? 'bg-orange-100 text-orange-800' :
                                                                                'bg-red-100 text-red-800'}`
                                                            }>
                                                                {mark.grade}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        No marks recorded for this term.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                        <Award size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Total Marks</p>
                                    <p className="text-3xl font-bold text-gray-800">{progressData.summary.total_marks}</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                        <Percent size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Average</p>
                                    <p className="text-3xl font-bold text-gray-800">{progressData.summary.average}%</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 opacity-5">
                                        <Award size={100} />
                                    </div>
                                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                                        <Award size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Term Rank</p>
                                    <p className="text-3xl font-bold text-gray-800">
                                        {progressData.summary.term_rank === 'N/A' ? 'N/A' : `#${progressData.summary.term_rank}`}
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                        <Percent size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Attendance</p>
                                    <p className="text-3xl font-bold text-gray-800">{progressData.summary.attendance_percentage}%</p>
                                </div>
                            </div>

                            <div className="mt-8 text-sm text-gray-500 text-center">
                                <p>Grading Scale: A (75-100), B (65-74), C (50-64), S (35-49), W (0-34)</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!selectedStudent && !loading && (
                    <div className="bg-white rounded-lg border border-dashed border-gray-300 p-16 text-center shadow-sm">
                        <FileText size={64} className="mx-auto text-gray-300 mb-6" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Student</h3>
                        <p className="text-gray-500 text-lg max-w-md mx-auto">Choose a term, grade, section, and student from the filters above to view and generate their progress card.</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-sm p-16 text-center border border-gray-100">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading progress report...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ProgressCard;
