import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { studentAPI } from '../../services/api';
import { Target, Award, TrendingUp, MessageSquare, Briefcase } from 'lucide-react';

interface PortfolioEntry {
    id: number;
    performance_summary: string;
    activities_achievements: string;
    areas_improvement: string;
    teacher_remarks: string;
    created_at: string;
    teacher_name: string;
}

const Portfolio = () => {
    const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const fetchPortfolio = async () => {
        try {
            const response = await studentAPI.getPortfolio();
            setPortfolioEntries(response.data);
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
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
            <div className="animate-fade-in space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-800">My Portfolio</h1>
                    <p className="text-gray-500 mt-1">View your comprehensive performance record</p>
                </div>

                {portfolioEntries.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No portfolio entries yet</p>
                        <p className="text-gray-400 text-sm mt-2">Your teachers will add assessments here</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {portfolioEntries.map((entry) => (
                            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-700">
                                        Recorded on {new Date(entry.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-gray-500">
                                        By {entry.teacher_name}
                                    </span>
                                </div>

                                {/* Content Grid */}
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Performance Summary */}
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2 text-blue-600 font-medium">
                                            <Target size={18} />
                                            <span>Performance Summary</span>
                                        </div>
                                        <div className="bg-blue-50/50 p-4 rounded-lg text-sm text-gray-700 min-h-[80px]">
                                            {entry.performance_summary || 'No summary available.'}
                                        </div>
                                    </div>

                                    {/* Areas for Improvement */}
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2 text-orange-600 font-medium">
                                            <TrendingUp size={18} />
                                            <span>Areas for Improvement</span>
                                        </div>
                                        <div className="bg-orange-50/50 p-4 rounded-lg text-sm text-gray-700 min-h-[80px]">
                                            {entry.areas_improvement || 'None specified.'}
                                        </div>
                                    </div>

                                    {/* Activities & Achievements */}
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2 text-green-600 font-medium">
                                            <Award size={18} />
                                            <span>Activities & Achievements</span>
                                        </div>
                                        <div className="bg-green-50/50 p-4 rounded-lg text-sm text-gray-700 min-h-[80px]">
                                            {entry.activities_achievements || 'No activities recorded.'}
                                        </div>
                                    </div>

                                    {/* Teacher Remarks */}
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2 text-indigo-600 font-medium">
                                            <MessageSquare size={18} />
                                            <span>Teacher Remarks</span>
                                        </div>
                                        <div className="bg-indigo-50/50 p-4 rounded-lg text-sm text-gray-700 min-h-[80px]">
                                            {entry.teacher_remarks || 'No remarks.'}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Portfolio;
