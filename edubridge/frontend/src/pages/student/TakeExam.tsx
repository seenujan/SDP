import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { studentAPI } from '../../services/api';
import { Clock, CheckCircle, ArrowLeft, ArrowRight, Save, Play, AlertCircle } from 'lucide-react';

interface Question {
    exam_question_id: number;
    question_id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    marks: number;
    options?: string[]; // Assuming backend sends string[] or JSON string
}

interface Exam {
    id: number;
    title: string;
    subject: string;
    duration: number;
    total_marks: number;
    start_time?: string; // from attempt
    questions: Question[];
}

const TakeExam = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exam, setExam] = useState<Exam | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-save debounce
    const saveTimeout = useRef<any>(null);

    useEffect(() => {
        fetchExamData();
    }, [id]);

    useEffect(() => {
        if (!timeLeft) return;
        if (timeLeft <= 0) {
            handleSubmit(true);
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const fetchExamData = async () => {
        try {
            if (!id) throw new Error('Exam ID is missing');
            console.log('Fetching exam:', id);

            setLoading(true);
            const response = await studentAPI.getExam(parseInt(id));
            const data = response.data;
            console.log('Exam Data:', data);

            if (!data.exam) throw new Error('Exam data invalid');

            // Parse Questions (handle JSON options)
            if (data.exam.questions) {
                data.exam.questions = data.exam.questions.map((q: any) => {
                    if (typeof q.options === 'string') {
                        try {
                            q.options = JSON.parse(q.options);
                        } catch (e) {
                            console.error('Failed to parse options for question', q.id, e);
                            q.options = [];
                        }
                    }
                    return q;
                });
            }

            // Parse Attempt Data
            let remainingTime = data.exam.duration * 60;
            if (data.attempt && data.attempt.start_time) {
                const start = new Date(data.attempt.start_time).getTime();
                const now = Date.now();
                const elapsed = Math.floor((now - start) / 1000);
                remainingTime = Math.max(0, (data.exam.duration * 60) - elapsed);
            }

            // Parse Answers
            const initialAnswers: Record<number, string> = {};
            if (data.answers) {
                data.answers.forEach((ans: any) => {
                    initialAnswers[ans.question_id] = ans.selected_option || ans.text_answer || '';
                });
            }

            setExam(data.exam);
            setAnswers(initialAnswers);
            setTimeLeft(remainingTime);
            setLoading(false);

        } catch (err: any) {
            console.error('Fetch Error:', err);
            setError(err.message || 'Failed to load exam');
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        // Auto-save
        setIsSaving(true);
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            try {
                // Prepare payload - assuming simple structure for now, adjust based on backend needs
                const payload = {
                    question_id: questionId,
                    selected_option: value,
                    text_answer: value
                };
                await studentAPI.saveAnswer(parseInt(id!), payload);
                setIsSaving(false);
            } catch (err) {
                console.error('Save failed', err);
                setIsSaving(false); // Optionally set error state
            }
        }, 1000);
    };

    const handleSubmit = async (auto = false) => {
        if (isSubmitting) return;

        if (!auto && !window.confirm('Finish Exam?')) return;

        setIsSubmitting(true);
        try {
            await studentAPI.submitExamAttempt(parseInt(id!), []);
            alert('Exam Submitted');
            navigate('/student/exams');
        } catch (err) {
            console.error('Submit Error', err);
            alert('Failed to submit');
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // --- Render Helpers ---

    if (loading) return (
        <DashboardLayout>
            <div className="p-8 text-center text-gray-500">Loading Exam...</div>
        </DashboardLayout>
    );

    if (error) return (
        <DashboardLayout>
            <div className="p-8 text-center text-red-600">
                <AlertCircle className="inline-block mb-2" size={32} />
                <h2 className="text-xl font-bold">Error</h2>
                <p>{error}</p>
                <button onClick={fetchExamData} className="mt-4 text-blue-600 underline">Retry</button>
            </div>
        </DashboardLayout>
    );

    if (!exam || !exam.questions || exam.questions.length === 0) return (
        <DashboardLayout>
            <div className="p-8 text-center text-gray-600">No questions found for this exam.</div>
        </DashboardLayout>
    );

    const question = exam.questions[currentQuestionIndex];
    if (!question) return <div>Question Index Error</div>; // Should not happen

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold">{exam.title}</h1>
                        <p className="text-gray-500">{exam.subject}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-gray-800'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-xs text-gray-400">
                            {isSaving ? 'Saving...' : 'Saved'}
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white p-8 rounded shadow-sm min-h-[400px]">
                    <div className="mb-4 flex justify-between">
                        <span className="font-semibold text-gray-500">Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">{question.marks} Marks</span>
                    </div>

                    <h2 className="text-lg font-medium mb-6">{question.question_text}</h2>

                    <div className="space-y-4">
                        {/* Options Render */}
                        {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && Array.isArray(question.options) && (
                            question.options.map((opt, idx) => (
                                <label key={idx} className={`block p-4 border rounded cursor-pointer hover:bg-gray-50 ${answers[question.question_id] === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name={`q-${question.question_id}`}
                                        value={opt}
                                        checked={answers[question.question_id] === opt}
                                        onChange={(e) => handleAnswer(question.question_id, e.target.value)}
                                        className="mr-3"
                                    />
                                    {opt}
                                </label>
                            ))
                        )}
                        {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && !question.options && (
                            // Fallback for TF if options missing
                            ['True', 'False'].map((opt) => (
                                <label key={opt} className={`block p-4 border rounded cursor-pointer hover:bg-gray-50 ${answers[question.question_id] === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name={`q-${question.question_id}`}
                                        value={opt}
                                        checked={answers[question.question_id] === opt}
                                        onChange={(e) => handleAnswer(question.question_id, e.target.value)}
                                        className="mr-3"
                                    />
                                    {opt}
                                </label>
                            ))
                        )}

                        {question.question_type === 'short_answer' && (
                            <textarea
                                className="w-full border p-3 rounded"
                                rows={5}
                                value={answers[question.question_id] || ''}
                                onChange={(e) => handleAnswer(question.question_id, e.target.value)}
                                placeholder="Type your answer..."
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => setCurrentQuestionIndex(curr => Math.max(0, curr - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>

                    {currentQuestionIndex === exam.questions.length - 1 ? (
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(curr => Math.min(exam.questions.length - 1, curr + 1))}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Next
                        </button>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default TakeExam;
