import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    subject: string;
    topic?: string;
    difficulty_level: string;
    marks: number;
    options?: string[];
    correct_answer?: string;
    created_at: string;
}

const QuestionBank = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        subject: '',
        topic: '',
        difficulty_level: 'medium',
        marks: 1,
        options: ['', '', '', ''],
        correct_answer: '',
        keywords: '', // For short answer auto-grading
    });

    // Fetch questions on mount
    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await teacherAPI.getQuestions();
            setQuestions(response.data || []);
        } catch (err: any) {
            console.error('Error fetching questions:', err);
            setError(err.response?.data?.error || 'Failed to load questions');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit: any = {
                question_text: formData.question_text,
                question_type: formData.question_type,
                subject: formData.subject,
                topic: formData.topic || null,
                difficulty_level: formData.difficulty_level,
                marks: Number(formData.marks),
                options: null,
                correct_answer: null,
            };

            // Handle different question types
            if (formData.question_type === 'multiple_choice') {
                dataToSubmit.options = JSON.stringify(formData.options);
                dataToSubmit.correct_answer = formData.correct_answer;
            } else if (formData.question_type === 'true_false') {
                dataToSubmit.correct_answer = formData.correct_answer; // 'true' or 'false'
            } else if (formData.question_type === 'short_answer') {
                dataToSubmit.correct_answer = formData.keywords; // Store keywords for auto-grading
            }

            if (editingQuestion) {
                await teacherAPI.updateQuestion(editingQuestion.id, dataToSubmit);
                alert('Question updated successfully!');
            } else {
                await teacherAPI.createQuestion(dataToSubmit);
                alert('Question created successfully!');
            }

            setShowModal(false);
            setEditingQuestion(null);
            resetForm();
            fetchQuestions();
        } catch (err: any) {
            console.error('Error saving question:', err);
            alert(err.response?.data?.error || 'Failed to save question');
        }
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);

        // Parse options if it's a JSON string
        let optionsArray = ['', '', '', ''];
        if (question.options) {
            if (typeof question.options === 'string') {
                try {
                    optionsArray = JSON.parse(question.options);
                } catch (e) {
                    console.error('Error parsing options:', e);
                    optionsArray = ['', '', '', ''];
                }
            } else if (Array.isArray(question.options)) {
                optionsArray = question.options;
            }
        }

        setFormData({
            question_text: question.question_text,
            question_type: question.question_type,
            subject: question.subject,
            topic: question.topic || '',
            difficulty_level: question.difficulty_level,
            marks: question.marks,
            options: optionsArray,
            correct_answer: question.correct_answer || '',
            keywords: question.correct_answer || '', // For short answer, correct_answer contains keywords
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this question?')) return;

        try {
            await teacherAPI.deleteQuestion(id);
            fetchQuestions();
        } catch (err: any) {
            console.error('Error deleting question:', err);
            alert('Failed to delete question');
        }
    };

    const resetForm = () => {
        setFormData({
            question_text: '',
            question_type: 'multiple_choice',
            subject: '',
            topic: '',
            difficulty_level: 'medium',
            marks: 1,
            options: ['', '', '', ''],
            correct_answer: '',
            keywords: '',
        });
    };

    // Safe filter with null checks
    const filteredQuestions = questions.filter((q) => {
        const searchLower = searchTerm.toLowerCase();
        const questionText = (q.question_text || '').toLowerCase();
        const subject = (q.subject || '').toLowerCase();
        return questionText.includes(searchLower) || subject.includes(searchLower);
    });

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading questions...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-center">
                        <p className="text-xl font-semibold mb-2">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={fetchQuestions}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Retry
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Question Bank</h1>
                        <p className="text-gray-600 mt-1">Manage your questions</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                    >
                        <Plus size={20} />
                        <span>Add Question</span>
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Questions List */}
                {filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500 mb-4">No questions found</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-primary-600 hover:text-primary-700"
                        >
                            Add your first question
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQuestions.map((question) => (
                            <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        {/* Badges */}
                                        <div className="flex items-center space-x-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                                                question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    question.difficulty_level === 'hard' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {(question.difficulty_level || 'N/A').toUpperCase()}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {(question.question_type || 'N/A').replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="text-sm text-gray-600">{question.subject || 'No Subject'}</span>
                                            {question.topic && (
                                                <span className="text-sm text-gray-500">• {question.topic}</span>
                                            )}
                                            <span className="text-sm font-medium text-primary-600">
                                                {question.marks || 0} marks
                                            </span>
                                        </div>

                                        {/* Question Text */}
                                        <p className="text-gray-800 font-medium mb-2">
                                            {question.question_text || 'No question text'}
                                        </p>

                                        {/* Options/Answer Display */}
                                        {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                {question.options.map((option, idx) => (
                                                    <div key={idx} className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-600">
                                                            {String.fromCharCode(65 + idx)}.
                                                        </span>
                                                        <span className={`text-sm ${option === question.correct_answer
                                                            ? 'text-green-600 font-medium'
                                                            : 'text-gray-700'
                                                            }`}>
                                                            {option}
                                                        </span>
                                                        {option === question.correct_answer && (
                                                            <span className="text-xs text-green-600">(Correct)</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* True/False Answer */}
                                        {question.question_type === 'true_false' && question.correct_answer && (
                                            <div className="mt-2">
                                                <span className="text-sm font-medium text-green-600">
                                                    Answer: {question.correct_answer === 'true' ? 'True' : 'False'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Short Answer Keywords */}
                                        {question.question_type === 'short_answer' && question.correct_answer && (
                                            <div className="mt-2">
                                                <span className="text-sm text-gray-600">
                                                    Keywords: <span className="font-medium">{question.correct_answer}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(question)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(question.id)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {editingQuestion ? 'Edit Question' : 'Add New Question'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Type and Difficulty */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Question Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.question_type}
                                            onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false">True/False</option>
                                            <option value="short_answer">Short Answer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Difficulty *
                                        </label>
                                        <select
                                            required
                                            value={formData.difficulty_level}
                                            onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Subject and Topic */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subject *
                                        </label>
                                        <select
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Select Subject</option>
                                            <option value="Mathematics">Mathematics</option>
                                            <option value="English">English</option>
                                            <option value="Science">Science</option>
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="Biology">Biology</option>
                                            <option value="History">History</option>
                                            <option value="Geography">Geography</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Physical Education">Physical Education</option>
                                            <option value="Art">Art</option>
                                            <option value="Music">Music</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Topic
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.topic}
                                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g., Algebra"
                                        />
                                    </div>
                                </div>

                                {/* Marks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Marks *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.marks}
                                        onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                {/* Question Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Question Text *
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.question_text}
                                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter your question..."
                                    />
                                </div>

                                {/* Conditional Fields Based on Question Type */}

                                {/* Multiple Choice Options */}
                                {formData.question_type === 'multiple_choice' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Options *
                                            </label>
                                            {formData.options.map((option, idx) => (
                                                <input
                                                    key={idx}
                                                    type="text"
                                                    required
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...formData.options];
                                                        newOptions[idx] = e.target.value;
                                                        setFormData({ ...formData, options: newOptions });
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2"
                                                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                                />
                                            ))}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Correct Answer *
                                            </label>
                                            <select
                                                required
                                                value={formData.correct_answer}
                                                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">Select correct answer</option>
                                                {formData.options.map((option, idx) => (
                                                    <option key={idx} value={option}>
                                                        {String.fromCharCode(65 + idx)}. {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* True/False Answer */}
                                {formData.question_type === 'true_false' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Correct Answer *
                                        </label>
                                        <select
                                            required
                                            value={formData.correct_answer}
                                            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Select correct answer</option>
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                        </select>
                                    </div>
                                )}

                                {/* Short Answer Keywords */}
                                {formData.question_type === 'short_answer' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Keywords for Auto-Grading *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.keywords}
                                            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            placeholder="Enter keywords separated by commas (e.g., photosynthesis, chlorophyll, sunlight)"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            The system will check if student answers contain these keywords for auto-grading
                                        </p>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingQuestion(null);
                                            resetForm();
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        {editingQuestion ? 'Update Question' : 'Add Question'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default QuestionBank;
