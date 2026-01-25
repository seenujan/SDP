import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { UserCircle, TrendingUp } from 'lucide-react';

const ViewProgress = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [progressData, setProgressData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchProgress(selectedChild.id);
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

    const fetchProgress = async (childId: number) => {
        setLoading(true);
        try {
            const response = await parentAPI.getChildProgress(childId);
            setProgressData(response.data);
        } catch (error) {
            console.error('Failed to fetch progress:', error);
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
                        <h1 className="text-3xl font-bold text-gray-800">Student Progress</h1>
                        <p className="text-gray-600 mt-1">Track comprehensive academic and attendance growth</p>
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

                {/* Submissions Section for now, can be expanded */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="mr-2" size={24} />
                        Recent Assignment Performance
                    </h2>

                    <div className="space-y-4">
                        {progressData?.submissions && progressData.submissions.length > 0 ? (
                            progressData.submissions.map((submission: any) => (
                                <div key={submission.id} className="border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{submission.assignment_title}</h4>
                                            <p className="text-sm text-gray-600">Subject: {submission.subject}</p>
                                            <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-primary-600">
                                                {submission.marks ? `${submission.marks}%` : 'Pending'}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${submission.status === 'graded' ? 'bg-green-100 text-green-700' :
                                                submission.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                                            </span>
                                        </div>
                                    </div>
                                    {submission.feedback && (
                                        <div className="mt-2 bg-gray-50 p-2 rounded text-sm text-gray-700 italic">
                                            "{submission.feedback}"
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">No assignment submissions recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ViewProgress;
