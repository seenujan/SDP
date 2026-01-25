import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { Briefcase, UserCircle, Award, Target, FileText } from 'lucide-react';

const ChildPortfolio = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [portfolioEntries, setPortfolioEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchPortfolio(selectedChild.id);
        }
    }, [selectedChild]);

    const fetchChildren = async () => {
        try {
            const response = await parentAPI.getDashboard();
            setChildren(response.data.children || []);
            if (response.data.children && response.data.children.length > 0) {
                setSelectedChild(response.data.children[0]);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
            setLoading(false);
        }
    };

    const fetchPortfolio = async (childId: number) => {
        setLoading(true);
        try {
            const response = await parentAPI.getChildPortfolio(childId);
            setPortfolioEntries(response.data);
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedChild) {
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Child Portfolio</h1>
                        <p className="text-gray-600 mt-1">View your child's comprehensive performance record</p>
                    </div>

                    {/* Child Selector */}
                    {children.length > 1 && (
                        <select
                            value={selectedChild?.id}
                            onChange={(e) => {
                                const child = children.find(c => c.id === parseInt(e.target.value));
                                setSelectedChild(child);
                            }}
                            className="bg-white border text-gray-800 px-4 py-2 rounded-lg"
                        >
                            {children.map((child) => (
                                <option key={child.id} value={child.id}>
                                    {child.full_name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {selectedChild && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                        <UserCircle size={40} className="text-primary-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">{selectedChild.full_name}</h2>
                            <p className="text-gray-500 text-sm">Grade {selectedChild.grade} • {selectedChild.section}</p>
                        </div>
                    </div>
                )}


                <div className="space-y-6">
                    {portfolioEntries.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">No portfolio entries found for this student.</p>
                        </div>
                    ) : (
                        portfolioEntries.map((entry) => (
                            <div key={entry.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                                    <span className="font-medium text-gray-700">
                                        Recorded on {new Date(entry.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        By {entry.teacher_name}
                                    </span>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2 text-primary-700">
                                                <Target size={20} />
                                                <h3 className="font-semibold">Performance Summary</h3>
                                            </div>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                                                {entry.performance_summary}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2 text-green-700">
                                                <Award size={20} />
                                                <h3 className="font-semibold">Activities & Achievements</h3>
                                            </div>
                                            <p className="text-gray-600 bg-green-50 p-3 rounded-lg text-sm leading-relaxed">
                                                {entry.activities_achievements}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2 text-orange-700">
                                                <Target size={20} />
                                                <h3 className="font-semibold">Areas for Improvement</h3>
                                            </div>
                                            <p className="text-gray-600 bg-orange-50 p-3 rounded-lg text-sm leading-relaxed">
                                                {entry.areas_improvement}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2 text-blue-700">
                                                <FileText size={20} />
                                                <h3 className="font-semibold">Teacher Remarks</h3>
                                            </div>
                                            <p className="text-gray-600 bg-blue-50 p-3 rounded-lg text-sm leading-relaxed">
                                                {entry.teacher_remarks}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ChildPortfolio;
