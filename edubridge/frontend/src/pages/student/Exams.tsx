import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { studentAPI } from '../../services/api';
import { BookOpen, Calendar, Clock, FileText } from 'lucide-react';

interface Exam {
    id: number;
    title: string;
    subject: string;
    exam_date: string;
    start_time: string;
    duration: number;
    total_marks: number;
    exam_type: string;
    description?: string;
    is_system_graded: boolean;
    attempt_status?: 'in_progress' | 'submitted' | 'evaluated' | null;
    attempt_score?: number;
}

const Exams = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'today' | 'past'>('today');

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const response = await studentAPI.getExams();
            setExams(response.data);
        } catch (error) {
            console.error('Failed to fetch exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const getExamStatus = (examDate: string) => {
        const date = new Date(examDate);
        const today = new Date();
        date.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) return 'today';
        if (date > today) return 'upcoming';
        return 'past';
    };

    const upcomingExams = exams.filter(exam => getExamStatus(exam.exam_date) === 'upcoming');
    const todayExams = exams.filter(exam => getExamStatus(exam.exam_date) === 'today');
    const pastExams = exams.filter(exam => getExamStatus(exam.exam_date) === 'past');

    let displayedExams: Exam[] = [];
    if (tab === 'upcoming') displayedExams = upcomingExams;
    if (tab === 'today') displayedExams = todayExams;
    if (tab === 'past') displayedExams = pastExams;

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
                    <h1 className="text-3xl font-bold text-gray-800">Exams</h1>
                    <p className="text-gray-600 mt-1">View your exam schedule and take online exams</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setTab('today')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'today' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Today ({todayExams.length})
                        </button>
                        <button
                            onClick={() => setTab('upcoming')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'upcoming' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Upcoming ({upcomingExams.length})
                        </button>
                        <button
                            onClick={() => setTab('past')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'past' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Past ({pastExams.length})
                        </button>
                    </div>
                </div>

                {/* Exams List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayedExams.length === 0 ? (
                        <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
                            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">
                                No {tab} exams
                            </p>
                        </div>
                    ) : (
                        displayedExams.map((exam) => (
                            <div key={exam.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start space-x-4 mb-4">
                                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shrink-0">
                                        <BookOpen className="text-white" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{exam.subject}</p>
                                    </div>
                                </div>

                                {exam.description && (
                                    <p className="text-gray-700 mb-4 text-sm">{exam.description}</p>
                                )}

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-700">
                                        <Calendar size={16} className="mr-2 text-gray-500" />
                                        <span>Date: {new Date(exam.exam_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700">
                                        <Clock size={16} className="mr-2 text-gray-500" />
                                        <span>Duration: {exam.duration} mins</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700">
                                        <FileText size={16} className="mr-2 text-gray-500" />
                                        <span>Total Marks: {exam.total_marks}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                        {exam.exam_type || 'Online'}
                                    </span>
                                    {tab === 'today' && (
                                        <>
                                            {(!exam.attempt_status) && (
                                                <button
                                                    onClick={() => navigate(`/student/exams/${exam.id}/take`)}
                                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                                                >
                                                    Take Exam
                                                </button>
                                            )}
                                            {exam.attempt_status === 'in_progress' && (
                                                <button
                                                    onClick={() => navigate(`/student/exams/${exam.id}/take`)}
                                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                                                >
                                                    Continue
                                                </button>
                                            )}
                                            {exam.attempt_status === 'submitted' && (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-green-600 font-medium text-sm">Submitted</span>
                                                    <button
                                                        onClick={() => navigate(`/student/exams/${exam.id}/review`)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {tab === 'past' && (
                                        <button
                                            onClick={() => navigate(`/student/exams/${exam.id}/review`)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                        >
                                            Review Result
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Exams;
