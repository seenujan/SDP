import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ClipboardList, UserCircle } from 'lucide-react';
import { parentAPI } from '../../services/api';

interface AttendanceRecord {
    id: number;
    student_id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    class?: string;
    subject?: string;
}

const ParentAttendance = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDays: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0,
    });

    useEffect(() => {
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChildId) {
            fetchAttendance(selectedChildId);
        }
    }, [selectedChildId]);

    const fetchChildren = async () => {
        try {
            const response = await parentAPI.getDashboard();
            setChildren(response.data.children || []);
            if (response.data.children && response.data.children.length > 0) {
                setSelectedChildId(response.data.children[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
            setLoading(false);
        }
    };

    const fetchAttendance = async (childId: number) => {
        setLoading(true);
        try {
            const response = await parentAPI.getChildAttendance(childId);
            const data = response.data.attendance || [];
            // API returns { attendance: [], stats: {} } as per ParentController
            setAttendance(data);

            // Re-calculate stats or use stats from backend
            // Using backend stats if available is better, but let's recalculate for consistency with table view if needed
            // ParentController returns { attendance, stats }
            const backendStats = response.data.stats;
            if (backendStats) {
                setStats({
                    totalDays: backendStats.total,
                    present: parseInt(backendStats.present),
                    absent: parseInt(backendStats.absent),
                    late: parseInt(backendStats.late),
                    percentage: parseFloat(backendStats.percentage)
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

    if (loading && children.length === 0) {
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
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
                        <p className="text-gray-600 mt-1">Track child's attendance records</p>
                    </div>

                    {children.length > 1 && (
                        <div className="mt-4 md:mt-0">
                            <select
                                value={selectedChildId || ''}
                                onChange={(e) => setSelectedChildId(parseInt(e.target.value))}
                                className="bg-white border text-gray-800 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {children.map((child) => (
                                    <option key={child.id} value={child.id}>
                                        {child.full_name} ({child.grade})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {!selectedChildId ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <UserCircle size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No student profile found linked to your account.</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                                        <p className="text-3xl font-bold text-green-600">{typeof stats.percentage === 'number' ? stats.percentage.toFixed(1) : stats.percentage}%</p>
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ParentAttendance;
