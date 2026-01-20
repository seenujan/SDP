import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { UserCircle, TrendingUp, Bell, Calendar } from 'lucide-react';

const ParentDashboard = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await parentAPI.getDashboard();
            setChildren(response.data.children || []);
            if (response.data.children && response.data.children.length > 0) {
                setSelectedChild(response.data.children[0]);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
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
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
                    <p className="text-gray-600 mt-1">Monitor your child's academic progress</p>
                </div>

                {/* Child Selector */}
                {children.length > 0 && (
                    <div className="bg-primary-600 rounded-lg p-6 mb-8 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <UserCircle size={64} className="mr-4" />
                                <div>
                                    <p className="text-sm opacity-90">Child Name</p>
                                    <h2 className="text-2xl font-bold">{selectedChild?.full_name}</h2>
                                    <div className="flex items-center mt-2 space-x-4 text-sm">
                                        <span className="flex items-center">
                                            <TrendingUp size={16} className="mr-1" />
                                            Grade: {selectedChild?.grade}
                                        </span>
                                        <span>Attendance: 92%</span>
                                        <span>Class Rank: #5</span>
                                    </div>
                                </div>
                            </div>
                            {children.length > 1 && (
                                <select
                                    value={selectedChild?.id}
                                    onChange={(e) => {
                                        const child = children.find(c => c.id === parseInt(e.target.value));
                                        setSelectedChild(child);
                                    }}
                                    className="bg-white text-gray-800 px-4 py-2 rounded-lg"
                                >
                                    {children.map((child) => (
                                        <option key={child.id} value={child.id}>
                                            {child.full_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Notifications */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Bell size={20} className="mr-2" />
                            Recent Notifications
                        </h3>
                        <div className="space-y-3">
                            <div className="border-l-4 border-orange-500 pl-4 py-2">
                                <p className="font-semibold text-gray-800">Maths assignment graded: 92%</p>
                                <p className="text-sm text-gray-600">2 hours ago</p>
                            </div>
                            <div className="border-l-4 border-blue-500 pl-4 py-2">
                                <p className="font-semibold text-gray-800">Science quiz scheduled for Oct 10, 2025</p>
                                <p className="text-sm text-gray-600">5 hours ago</p>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4 py-2">
                                <p className="font-semibold text-gray-800">Your child's attendance updated for this week</p>
                                <p className="text-sm text-gray-600">1 day ago</p>
                            </div>
                            <div className="border-l-4 border-blue-500 pl-4 py-2">
                                <p className="font-semibold text-gray-800">PTM details confirmed for Nov 8</p>
                                <p className="text-sm text-gray-600">2 days ago</p>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming PTM */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Calendar size={20} className="mr-2" />
                            Upcoming PTM
                        </h3>
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-800">New Parent-Teacher Meeting</p>
                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Confirmed</span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-700">
                                <p className="font-semibold text-lg">Nov 8, 2025 at 2:00 PM</p>
                                <p>Teacher: Prakash Saneshan (Maths)</p>
                                <p>Location: School Main Hall</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ParentDashboard;
