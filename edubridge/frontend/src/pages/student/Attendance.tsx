import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ClipboardList } from 'lucide-react';
import { studentAPI } from '../../services/api';

interface AttendanceRecord {
    id: number;
    student_id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    class?: string;
    subject?: string;
}

const Attendance = () => {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDays: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0,
    });
    // Filter out month selector for now as backend returns all history or specific logic needed
    // Assuming backend returns all history sorted by date DESC

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await studentAPI.getAttendance();
            const { attendance, stats } = response.data;
            setAttendance(attendance || []);

            // Use backend stats if available, or calculate (backend sends stats now)
            if (stats) {
                setStats({
                    totalDays: stats.total,
                    present: parseInt(stats.present),
                    absent: parseInt(stats.absent),
                    late: parseInt(stats.late),
                    percentage: parseFloat(stats.percentage)
                });
            } else {
                // Fallback calculation if stats missing
                const data = attendance || [];
                const present = data.filter((a: any) => a.status === 'present').length;
                const absent = data.filter((a: any) => a.status === 'absent').length;
                const late = data.filter((a: any) => a.status === 'late').length;
                const total = data.length;
                const percentage = total > 0 ? (present / total) * 100 : 0;

                setStats({
                    totalDays: total,
                    present,
                    absent,
                    late,
                    percentage,
                });
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present':
                return 'text-green-600 bg-green-100';
            case 'absent':
                return 'text-red-600 bg-red-100';
            case 'late':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
                    <p className="text-gray-600 mt-1">Track your attendance records</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                                <p className="text-3xl font-bold text-green-600">{stats.percentage.toFixed(1)}%</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <ClipboardList className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Present</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.present}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Absent</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.absent}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Late</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.late}</p>
                        </div>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">Attendance History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {attendance.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No attendance records found.</td></tr>
                                ) : (
                                    attendance.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-500 text-sm">#{record.id}</td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{record.student_id}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {record.class || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {record.subject || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Attendance;
