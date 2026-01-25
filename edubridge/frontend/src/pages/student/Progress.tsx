import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TrendingUp, BarChart3, FileText, Award } from 'lucide-react';

interface ProgressData {
    subject: string;
    currentGrade: string;
    averageScore: number;
    trend: 'up' | 'down' | 'stable';
    recentScores: number[];
}

const Progress = () => {
    const [progressData, setProgressData] = useState<ProgressData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            // For now, using placeholder
            // Real implementation: const response = await studentAPI.getProgress();
            const mockProgress: ProgressData[] = [];
            setProgressData(mockProgress);
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') {
            return <TrendingUp className="text-green-600" size={20} />;
        } else if (trend === 'down') {
            return <TrendingUp className="text-red-600 transform rotate-180" size={20} />;
        }
        return <div className="w-5 h-0.5 bg-gray-600"></div>;
    };

    const getTrendColor = (trend: string) => {
        if (trend === 'up') return 'text-green-600 bg-green-50';
        if (trend === 'down') return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
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
                    <h1 className="text-3xl font-bold text-gray-800">View Progress</h1>
                    <p className="text-gray-600 mt-1">Track your academic performance over time</p>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Overall GPA</p>
                                <p className="text-3xl font-bold text-gray-800">0.0</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Award className="text-primary-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Subjects Tracked</p>
                                <p className="text-3xl font-bold text-gray-800">{progressData.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Improving Subjects</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {progressData.filter(p => p.trend === 'up').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress by Subject */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                        <BarChart3 size={20} className="mr-2" />
                        Subject-wise Progress
                    </h2>

                    {progressData.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">No progress data available yet</p>
                            <p className="text-gray-400 text-sm mt-2">Your progress will be tracked as you complete more assessments</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {progressData.map((subject, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 text-lg">{subject.subject}</h3>
                                            <p className="text-sm text-gray-600 mt-1">Current Grade: {subject.currentGrade}</p>
                                        </div>
                                        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getTrendColor(subject.trend)}`}>
                                            {getTrendIcon(subject.trend)}
                                            <span className="font-semibold text-sm capitalize">{subject.trend}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-2">Average Score: {subject.averageScore.toFixed(1)}%</p>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${subject.averageScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-800">{subject.averageScore.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    {/* Recent Scores Mini Chart */}
                                    {subject.recentScores.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-600 mb-2">Recent Test Scores</p>
                                            <div className="flex items-end space-x-2 h-16">
                                                {subject.recentScores.map((score, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center">
                                                        <div
                                                            className="w-full bg-primary-500 rounded-t"
                                                            style={{ height: `${score}%` }}
                                                        ></div>
                                                        <span className="text-xs text-gray-600 mt-1">{score}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress Card Access */}
                <div className="mt-6 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Progress Card</h3>
                            <p className="text-primary-100">Download your comprehensive academic progress report</p>
                        </div>
                        <button className="px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-semibold">
                            Download Progress Card
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Progress;
