import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const ReviewStudentExam = () => {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await teacherAPI.getStudentAttemptDetails(parseInt(attemptId!));
                setData(response.data);
            } catch (error) {
                console.error('Failed to load attempt details', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [attemptId]);

    if (loading) return <DashboardLayout><div>Loading...</div></DashboardLayout>;
    if (!data) return <DashboardLayout><div>No data found</div></DashboardLayout>;

    const { attempt, student, answers } = data;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-6">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={16} className="mr-2" /> Back
                </button>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-6 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{student.full_name}</h1>
                            <p className="text-gray-500">Roll No: {student.roll_number}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-purple-600">
                                {attempt.total_score} Marks
                            </div>
                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-2">
                                {attempt.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {answers.map((ans: any, index: number) => (
                        <div key={ans.id} className={`bg-white p-6 rounded-lg shadow-sm border ${ans.is_correct ? 'border-green-200' : 'border-red-200'}`}>
                            <div className="flex justify-between mb-4">
                                <h3 className="font-medium text-gray-800">Question {index + 1}</h3>
                                <span className={`flex items-center text-sm font-medium ${ans.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                    {ans.is_correct ? <CheckCircle size={16} className="mr-1" /> : <XCircle size={16} className="mr-1" />}
                                    {ans.marks_awarded} / {ans.max_marks} Marks
                                </span>
                            </div>

                            <p className="text-gray-800 mb-4">{ans.question_text}</p>

                            <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                                <div>
                                    <span className="font-semibold text-gray-500 block mb-1">Student Answer:</span>
                                    <p className={ans.is_correct ? 'text-green-700' : 'text-red-700'}>
                                        {ans.selected_option || ans.text_answer || '(No Answer)'}
                                    </p>
                                </div>
                                {!ans.is_correct && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <span className="font-semibold text-gray-500 block mb-1">Correct Answer:</span>
                                        <p className="text-gray-700">{ans.model_answer}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReviewStudentExam;
