import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { Users, Calendar, Save, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
}

interface Class {
    id: number; // This is the class_id from database
    timetable_id: number; // The specific timetable slot ID
    grade: string;
    section: string;
    class_name: string;
    subject: string;
    subject_id?: number;
    student_count: number;
}

const Attendance = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dayOfWeek, setDayOfWeek] = useState('');
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedTimetableId, setSelectedTimetableId] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<{ [key: number]: 'present' | 'absent' | 'late' }>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Calculate day of week from date
    const calculateDayOfWeek = (dateString: string): string => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const date = new Date(dateString);
        return days[date.getDay()];
    };

    // Fetch classes when date changes
    useEffect(() => {
        const day = calculateDayOfWeek(selectedDate);
        setDayOfWeek(day);
        fetchClassesForDay(day);
        setSelectedTimetableId(null);
        setStudents([]);
    }, [selectedDate]);

    // Fetch students when class/timetable slot is selected
    useEffect(() => {
        if (selectedTimetableId) {
            fetchStudents();
            fetchExistingAttendance();
        }
    }, [selectedTimetableId]);

    const fetchClassesForDay = async (day: string) => {
        setLoading(true);
        try {
            const response = await teacherAPI.getMyClasses(day);
            setClasses(response.data || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setClasses([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!selectedTimetableId) return;

        setLoading(true);
        try {
            // We need classId to fetch students. Find it from the selected timetable slot.
            const selectedClassData = classes.find(c => c.timetable_id === selectedTimetableId);
            if (!selectedClassData) return;

            const response = await teacherAPI.getClassStudents(selectedClassData.id);
            setStudents(response.data || []);

            // Initialize attendance as all present
            const initialAttendance: { [key: number]: 'present' | 'absent' | 'late' } = {};
            (response.data || []).forEach((student: Student) => {
                initialAttendance[student.id] = 'present';
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchExistingAttendance = async () => {
        if (!selectedTimetableId) return;

        try {
            const selectedClassData = classes.find(c => c.timetable_id === selectedTimetableId);
            if (!selectedClassData) return;

            const response = await teacherAPI.getAttendanceHistory(
                selectedClassData.grade,
                selectedDate
            );

            if (response.data && response.data.length > 0) {
                const existingAttendance: { [key: number]: 'present' | 'absent' | 'late' } = {};
                // Filter by timetable (or subject) if needed, though getAttendanceHistory currently returns all for the grade/date
                // Ideally we should filter by specific subject/timetable if the API returns mixed data.
                // As per refactor, we are using timetable_id, so let's check if API response includes it.
                // The API calls getClassAttendance which we updated to join timetable.

                response.data.forEach((record: any) => {
                    if (record.timetable_id === selectedTimetableId) {
                        existingAttendance[record.student_id] = record.status;
                    }
                });

                // Only merge if we found matching records
                if (Object.keys(existingAttendance).length > 0) {
                    setAttendance(prev => ({ ...prev, ...existingAttendance }));
                }
            }
        } catch (error) {
            console.error('Error fetching attendance history:', error);
        }
    };

    const handleAttendanceChange = (studentId: number, status: 'present' | 'absent' | 'late') => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSaveAttendance = async () => {
        if (!selectedTimetableId) {
            alert('Please select a class');
            return;
        }

        const selectedClassData = classes.find(c => c.timetable_id === selectedTimetableId);
        if (!selectedClassData) return;

        setSaving(true);
        try {
            const attendanceData = students.map(student => ({
                studentId: student.id,
                status: attendance[student.id] || 'present',
                date: selectedDate,
                timetableId: selectedTimetableId, // use timetable_id
            }));

            await teacherAPI.markAttendance(attendanceData);
            alert('Attendance saved successfully!');
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Failed to save attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ... (helper functions getStatusColor, getStatusIcon remain same)

    const getStatusColor = (status: 'present' | 'absent' | 'late') => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-700 border-green-300';
            case 'absent': return 'bg-red-100 text-red-700 border-red-300';
            case 'late': return 'bg-orange-100 text-orange-700 border-orange-300';
        }
    };

    const getStatusIcon = (status: 'present' | 'absent' | 'late') => {
        switch (status) {
            case 'present': return <CheckCircle size={16} />;
            case 'absent': return <XCircle size={16} />;
            case 'late': return <Clock size={16} />;
        }
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
                    <p className="text-gray-600 mt-1">Mark and manage student attendance</p>
                </div>

                {/* Date Selection */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="inline mr-2" size={16} />
                                Select Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Users className="inline mr-2" size={16} />
                                Select Class
                            </label>
                            <select
                                value={selectedTimetableId || ''}
                                onChange={(e) => setSelectedTimetableId(Number(e.target.value) || null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={loading || classes.length === 0}
                            >
                                <option value="">Choose a class...</option>
                                {classes.map(cls => (
                                    <option key={cls.timetable_id} value={cls.timetable_id}>
                                        {cls.class_name} - {cls.subject} ({cls.student_count} students)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Day Indicator */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">Day:</span> {dayOfWeek}
                            {classes.length === 0 && !loading && (
                                <span className="ml-2 text-blue-600">
                                    - No classes assigned in timetable for this day
                                </span>
                            )}
                            {classes.length > 0 && (
                                <span className="ml-2 text-green-600">
                                    - {classes.length} class(es) found
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Student List */}
                {selectedTimetableId && students.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Student List ({students.length})
                            </h2>
                            <button
                                onClick={handleSaveAttendance}
                                disabled={saving || loading}
                                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                            >
                                <Save size={18} className="mr-2" />
                                {saving ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Roll No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            Attendance Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.roll_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.full_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center gap-2">
                                                    {(['present', 'absent', 'late'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleAttendanceChange(student.id, status)}
                                                            className={`flex items-center gap-1 px-4 py-2 rounded-lg border-2 transition-all ${attendance[student.id] === status
                                                                ? getStatusColor(status)
                                                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                                                }`}
                                                        >
                                                            {getStatusIcon(status)}
                                                            <span className="capitalize text-sm font-medium">{status}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <p className="text-gray-500">Loading...</p>
                    </div>
                )}

                {/* Empty States */}
                {!loading && !selectedTimetableId && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Users size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">Please select a class to mark attendance</p>
                    </div>
                )}

                {!loading && selectedTimetableId && students.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Users size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No students found in this class</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Attendance;

