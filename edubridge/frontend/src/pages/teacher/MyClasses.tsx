import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { Users, BookOpen, Calendar, UserCheck } from 'lucide-react';

interface Class {
    id: number;
    grade: string;
    section: string;
    class_name: string;
    student_count: number;
}

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
    grade: string;
    section: string;
    email: string;
}

const MyClasses = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await teacherAPI.getMyClasses();
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClassClick = async (classData: Class) => {
        setSelectedClass(classData);
        setLoadingStudents(true);
        try {
            const response = await teacherAPI.getClassStudents(classData.id);
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleMarkAttendance = () => {
        navigate('/teacher/attendance');
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Classes</h1>
                    <p className="text-gray-600 mt-1">View and manage your assigned classes</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Classes List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <BookOpen className="mr-2" size={20} />
                                Classes ({classes.length})
                            </h2>

                            {loading ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Loading classes...</p>
                                </div>
                            ) : classes.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">No classes assigned</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {classes.map((classData) => (
                                        <button
                                            key={classData.id}
                                            onClick={() => handleClassClick(classData)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedClass?.id === classData.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                {classData.class_name}
                                            </h3>
                                            <p className="text-sm text-gray-600 flex items-center">
                                                <Users size={14} className="mr-1" />
                                                {classData.student_count} students
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {selectedClass ? (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                            <Users className="mr-2" size={20} />
                                            Students in {selectedClass.class_name}
                                        </h2>
                                        <button
                                            onClick={handleMarkAttendance}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <UserCheck size={18} className="mr-2" />
                                            Mark Attendance
                                        </button>
                                    </div>

                                    {loadingStudents ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Loading students...</p>
                                        </div>
                                    ) : students.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-500 text-lg">No students in this class</p>
                                        </div>
                                    ) : (
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
                                                            Email
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Class
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
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                {student.email}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                {student.grade} {student.section}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 text-lg">Select a class to view students</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                {classes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Classes</p>
                                    <p className="text-3xl font-bold mt-1">{classes.length}</p>
                                </div>
                                <BookOpen size={40} className="opacity-80" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Total Students</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {classes.reduce((sum, cls) => sum + cls.student_count, 0)}
                                    </p>
                                </div>
                                <Users size={40} className="opacity-80" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Average Class Size</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {Math.round(classes.reduce((sum, cls) => sum + cls.student_count, 0) / classes.length)}
                                    </p>
                                </div>
                                <Calendar size={40} className="opacity-80" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyClasses;
