import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Search, Sparkles, FileUp, CheckSquare, Square, Loader2, X, BookOpen } from 'lucide-react';

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
    is_owner?: boolean;
}

interface AiQuestion {
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    options: string[];
    correct_answer: string;
    difficulty_level: 'easy' | 'medium' | 'hard';
    marks: number;
    topic?: string;
    selected: boolean;
}

const QuestionBank = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [subjects, setSubjects] = useState<any[]>([]);

    // Choice modal
    const [showChoiceModal, setShowChoiceModal] = useState(false);

    // AI Extraction modal
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiStep, setAiStep] = useState<'upload' | 'loading' | 'review'>('upload');
    const [aiFile, setAiFile] = useState<File | null>(null);
    const [aiSubjectId, setAiSubjectId] = useState('');
    const [aiInstructions, setAiInstructions] = useState('Generate 5 multiple choice questions, medium difficulty');
    const [aiExtractedQuestions, setAiExtractedQuestions] = useState<AiQuestion[]>([]);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiError, setAiError] = useState('');

    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        subject_id: '',
        topic: '',
        difficulty_level: 'medium',
        marks: 1,
        options: ['', '', '', ''],
        correct_answer: '',
        keywords: '',
    });

    useEffect(() => {
        fetchQuestions();
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await teacherAPI.getAllSubjects();
            setSubjects(response.data);
            if (response.data.length > 0) setAiSubjectId(response.data[0].id.toString());
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

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
                subject_id: parseInt(formData.subject_id),
                topic: formData.topic || null,
                difficulty_level: formData.difficulty_level,
                marks: Number(formData.marks),
                options: null,
                correct_answer: null,
            };

            if (formData.question_type === 'multiple_choice') {
                dataToSubmit.options = JSON.stringify(formData.options);
                dataToSubmit.correct_answer = formData.correct_answer;
            } else if (formData.question_type === 'true_false') {
                dataToSubmit.correct_answer = formData.correct_answer;
            } else if (formData.question_type === 'short_answer') {
                dataToSubmit.correct_answer = formData.keywords;
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
        let optionsArray = ['', '', '', ''];
        if (question.options) {
            if (typeof question.options === 'string') {
                try { optionsArray = JSON.parse(question.options); } catch (e) { optionsArray = ['', '', '', '']; }
            } else if (Array.isArray(question.options)) {
                optionsArray = question.options;
            }
        }
        setFormData({
            question_text: question.question_text,
            question_type: question.question_type,
            subject_id: (question as any).subject_id?.toString() || '',
            topic: question.topic || '',
            difficulty_level: question.difficulty_level,
            marks: question.marks,
            options: optionsArray,
            correct_answer: question.correct_answer || '',
            keywords: question.correct_answer || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await teacherAPI.deleteQuestion(id);
            fetchQuestions();
        } catch (err: any) {
            alert('Failed to delete question');
        }
    };

    const resetForm = () => {
        setFormData({
            question_text: '',
            question_type: 'multiple_choice',
            subject_id: '',
            topic: '',
            difficulty_level: 'medium',
            marks: 1,
            options: ['', '', '', ''],
            correct_answer: '',
            keywords: '',
        });
    };

    // ── AI Extraction Handlers ──────────────────────────────────────────────────

    const openAiModal = () => {
        setShowChoiceModal(false);
        setAiStep('upload');
        setAiFile(null);
        setAiError('');
        setAiExtractedQuestions([]);
        setAiInstructions('Generate 5 multiple choice questions, medium difficulty');
        setShowAiModal(true);
    };

    const handleAiExtract = async () => {
        if (!aiFile) { setAiError('Please select a file.'); return; }
        if (!aiSubjectId) { setAiError('Please select a subject.'); return; }
        if (!aiInstructions.trim()) { setAiError('Please enter instructions for the AI.'); return; }

        setAiStep('loading');
        setAiError('');

        try {
            const formData = new FormData();
            formData.append('file', aiFile);
            formData.append('subject_id', aiSubjectId);
            formData.append('instructions', aiInstructions);

            const response = await teacherAPI.extractQuestionsFromFile(formData);
            const questions: AiQuestion[] = (response.data.questions || []).map((q: any) => ({
                ...q,
                selected: true,
            }));

            if (questions.length === 0) {
                setAiError('AI could not extract questions from this file. Try a clearer document or different instructions.');
                setAiStep('upload');
                return;
            }

            setAiExtractedQuestions(questions);
            setAiStep('review');
        } catch (err: any) {
            setAiError(err.response?.data?.error || 'AI extraction failed. Please try again.');
            setAiStep('upload');
        }
    };

    const toggleAiQuestionSelection = (idx: number) => {
        setAiExtractedQuestions(prev => prev.map((q, i) => i === idx ? { ...q, selected: !q.selected } : q));
    };

    const updateAiQuestionText = (idx: number, text: string) => {
        setAiExtractedQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question_text: text } : q));
    };

    const handleSaveSelected = async () => {
        const selected = aiExtractedQuestions.filter(q => q.selected);
        if (selected.length === 0) { alert('Please select at least one question.'); return; }

        setAiSaving(true);
        try {
            await teacherAPI.bulkSaveQuestions(selected, parseInt(aiSubjectId));
            alert(`✅ ${selected.length} question(s) saved to Question Bank!`);
            setShowAiModal(false);
            fetchQuestions();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save questions.');
        } finally {
            setAiSaving(false);
        }
    };

    const difficultyColor = (d: string) =>
        d === 'easy' ? 'bg-green-100 text-green-800' :
        d === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800';

    const filteredQuestions = questions.filter(q => {
        const s = searchTerm.toLowerCase();
        return (q.question_text || '').toLowerCase().includes(s) || (q.subject || '').toLowerCase().includes(s);
    });

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary-600 mr-2" size={24} />
                <p className="text-gray-500">Loading questions...</p>
            </div>
        </DashboardLayout>
    );

    if (error) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
                <button onClick={fetchQuestions} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Retry</button>
            </div>
        </DashboardLayout>
    );

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
                        onClick={() => setShowChoiceModal(true)}
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
                        <BookOpen className="mx-auto text-gray-400 mb-3" size={40} />
                        <p className="text-gray-500 mb-4">No questions found</p>
                        <button onClick={() => setShowChoiceModal(true)} className="text-primary-600 hover:text-primary-700">
                            Add your first question
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQuestions.map((question) => (
                            <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColor(question.difficulty_level)}`}>
                                                {(question.difficulty_level || 'N/A').toUpperCase()}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {(question.question_type || 'N/A').replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="text-sm text-gray-600">{question.subject || 'No Subject'}</span>
                                            {question.topic && <span className="text-sm text-gray-500">• {question.topic}</span>}
                                            <span className="text-sm font-medium text-primary-600">{question.marks || 0} marks</span>
                                        </div>
                                        <p className="text-gray-800 font-medium mb-2">{question.question_text || 'No question text'}</p>
                                        {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                {question.options.map((option, idx) => (
                                                    <div key={idx} className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-600">{String.fromCharCode(65 + idx)}.</span>
                                                        <span className={`text-sm ${option === question.correct_answer ? 'text-green-600 font-medium' : 'text-gray-700'}`}>{option}</span>
                                                        {option === question.correct_answer && <span className="text-xs text-green-600">(Correct)</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {question.question_type === 'true_false' && question.correct_answer && (
                                            <div className="mt-2">
                                                <span className="text-sm font-medium text-green-600">Answer: {question.correct_answer === 'true' ? 'True' : 'False'}</span>
                                            </div>
                                        )}
                                        {question.question_type === 'short_answer' && question.correct_answer && (
                                            <div className="mt-2">
                                                <span className="text-sm text-gray-600">Keywords: <span className="font-medium">{question.correct_answer}</span></span>
                                            </div>
                                        )}
                                    </div>
                                    {question.is_owner && (
                                        <div className="flex space-x-2 ml-4">
                                            <button onClick={() => handleEdit(question)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="Edit Question"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(question.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Delete Question"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── CHOICE MODAL ─────────────────────────────────────────────── */}
                {showChoiceModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Add Question</h2>
                                <button onClick={() => setShowChoiceModal(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                            </div>
                            <p className="text-gray-500 mb-6">How would you like to add questions?</p>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Manual Option */}
                                <button
                                    onClick={() => { setShowChoiceModal(false); resetForm(); setEditingQuestion(null); setShowModal(true); }}
                                    className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                                >
                                    <div className="w-14 h-14 bg-gray-100 group-hover:bg-primary-100 rounded-full flex items-center justify-center mb-3 transition-colors">
                                        <Edit2 size={24} className="text-gray-600 group-hover:text-primary-600" />
                                    </div>
                                    <span className="font-semibold text-gray-800">Add Manually</span>
                                    <span className="text-xs text-gray-500 mt-1 text-center">Type question & answers yourself</span>
                                </button>
                                {/* AI Extract Option */}
                                <button
                                    onClick={openAiModal}
                                    className="flex flex-col items-center p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                                >
                                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                                        <Sparkles size={24} className="text-purple-600" />
                                    </div>
                                    <span className="font-semibold text-gray-800">Extract with AI</span>
                                    <span className="text-xs text-gray-500 mt-1 text-center">Upload a PDF/PPT lesson file</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MANUAL ADD/EDIT MODAL ────────────────────────────────────── */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {editingQuestion ? 'Edit Question' : 'Add New Question'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
                                        <select required value={formData.question_type} onChange={(e) => setFormData({ ...formData, question_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false">True/False</option>
                                            <option value="short_answer">Short Answer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                                        <select required value={formData.difficulty_level} onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                        <select required value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option value="">Select Subject</option>
                                            {subjects.map((subj) => (<option key={subj.id} value={subj.id}>{subj.subject_name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                                        <input type="text" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., Algebra" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks *</label>
                                    <input type="number" required min="1" value={formData.marks} onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                                    <textarea required rows={3} value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Enter your question..." />
                                </div>
                                {formData.question_type === 'multiple_choice' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                            {formData.options.map((option, idx) => (
                                                <input key={idx} type="text" required value={option} onChange={(e) => { const newOptions = [...formData.options]; newOptions[idx] = e.target.value; setFormData({ ...formData, options: newOptions }); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2" placeholder={`Option ${String.fromCharCode(65 + idx)}`} />
                                            ))}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                                            <select required value={formData.correct_answer} onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                                <option value="">Select correct answer</option>
                                                {formData.options.map((option, idx) => (<option key={idx} value={option}>{String.fromCharCode(65 + idx)}. {option}</option>))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                {formData.question_type === 'true_false' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                                        <select required value={formData.correct_answer} onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option value="">Select correct answer</option>
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                        </select>
                                    </div>
                                )}
                                {formData.question_type === 'short_answer' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Keywords for Auto-Grading *</label>
                                        <input type="text" required value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Enter keywords separated by commas" />
                                        <p className="text-xs text-gray-500 mt-1">The system checks if student answers contain these keywords</p>
                                    </div>
                                )}
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button type="button" onClick={() => { setShowModal(false); setEditingQuestion(null); resetForm(); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingQuestion ? 'Update Question' : 'Add Question'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── AI EXTRACTION MODAL ──────────────────────────────────────── */}
                {showAiModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b px-8 py-5 z-10 flex justify-between items-center rounded-t-2xl">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Sparkles size={20} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">AI Question Extraction</h2>
                                        <p className="text-sm text-gray-500">
                                            {aiStep === 'upload' ? 'Upload your lesson file' : aiStep === 'loading' ? 'Extracting questions...' : `Review & select questions (${aiExtractedQuestions.filter(q => q.selected).length} of ${aiExtractedQuestions.length} selected)`}
                                        </p>
                                    </div>
                                </div>
                                {aiStep !== 'loading' && (
                                    <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                                )}
                            </div>

                            <div className="p-8">
                                {/* STEP: UPLOAD */}
                                {aiStep === 'upload' && (
                                    <div className="space-y-5">
                                        {aiError && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{aiError}</div>
                                        )}
                                        {/* File Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Lesson File (PDF, PPT, PPTX, TXT) *</label>
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
                                                onClick={() => document.getElementById('ai-file-input')?.click()}
                                            >
                                                <FileUp size={32} className="mx-auto text-gray-400 mb-3" />
                                                {aiFile ? (
                                                    <div>
                                                        <p className="font-medium text-gray-800">{aiFile.name}</p>
                                                        <p className="text-sm text-gray-500 mt-1">{(aiFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-gray-600 font-medium">Click to upload or drag & drop</p>
                                                        <p className="text-sm text-gray-400 mt-1">PDF, PPT, PPTX, TXT — max 15MB</p>
                                                    </div>
                                                )}
                                                <input
                                                    id="ai-file-input"
                                                    type="file"
                                                    accept=".pdf,.ppt,.pptx,.txt"
                                                    className="hidden"
                                                    onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                                                />
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                            <select value={aiSubjectId} onChange={(e) => setAiSubjectId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                                <option value="">Select Subject</option>
                                                {subjects.map(s => (<option key={s.id} value={s.id}>{s.subject_name}</option>))}
                                            </select>
                                        </div>

                                        {/* Instructions */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions for AI *</label>
                                            <textarea
                                                rows={3}
                                                value={aiInstructions}
                                                onChange={(e) => setAiInstructions(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="e.g., Generate 10 multiple choice questions, medium difficulty, focused on Chapter 3"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Be specific: include number of questions, type (MCQ/True-False), and difficulty level</p>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleAiExtract}
                                                disabled={!aiFile || !aiSubjectId}
                                                className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
                                            >
                                                <Sparkles size={18} />
                                                <span>Extract Questions with AI</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP: LOADING */}
                                {aiStep === 'loading' && (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-5">
                                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Loader2 size={36} className="text-purple-600 animate-spin" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-semibold text-gray-800">AI is reading your file...</p>
                                            <p className="text-gray-500 mt-2">Gemini is extracting and generating questions. This may take 15–30 seconds.</p>
                                        </div>
                                    </div>
                                )}

                                {/* STEP: REVIEW */}
                                {aiStep === 'review' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-gray-600">Review the extracted questions. Select the ones you want to save.</p>
                                            <button
                                                onClick={() => setAiExtractedQuestions(prev => prev.map(q => ({ ...q, selected: !prev.every(q => q.selected) })))}
                                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                                            >
                                                {aiExtractedQuestions.every(q => q.selected) ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        {aiExtractedQuestions.map((q, idx) => (
                                            <div
                                                key={idx}
                                                className={`border-2 rounded-xl p-5 transition-all ${q.selected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <button onClick={() => toggleAiQuestionSelection(idx)} className="mt-1 flex-shrink-0">
                                                        {q.selected
                                                            ? <CheckSquare size={22} className="text-purple-600" />
                                                            : <Square size={22} className="text-gray-400" />
                                                        }
                                                    </button>
                                                    <div className="flex-1">
                                                        {/* Badges */}
                                                        <div className="flex items-center flex-wrap gap-2 mb-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty_level)}`}>
                                                                {q.difficulty_level.toUpperCase()}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {q.question_type.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                            {q.topic && <span className="text-xs text-gray-500">📚 {q.topic}</span>}
                                                            <span className="text-xs font-medium text-primary-600">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                                        </div>

                                                        {/* Question text (editable) */}
                                                        <textarea
                                                            rows={2}
                                                            value={q.question_text}
                                                            onChange={(e) => updateAiQuestionText(idx, e.target.value)}
                                                            className="w-full text-gray-800 font-medium bg-transparent border border-transparent hover:border-gray-300 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 rounded-lg px-2 py-1 resize-none focus:outline-none"
                                                        />

                                                        {/* MCQ Options */}
                                                        {q.question_type === 'multiple_choice' && q.options.length > 0 && (
                                                            <div className="mt-3 space-y-1">
                                                                {q.options.map((opt, oi) => (
                                                                    <div key={oi} className="flex items-center space-x-2">
                                                                        <span className="text-sm text-gray-500">{String.fromCharCode(65 + oi)}.</span>
                                                                        <span className={`text-sm ${opt === q.correct_answer ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>{opt}</span>
                                                                        {opt === q.correct_answer && (
                                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Correct</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* True/False Answer */}
                                                        {q.question_type === 'true_false' && (
                                                            <div className="mt-2">
                                                                <span className="text-sm font-medium text-green-600">Answer: {q.correct_answer}</span>
                                                            </div>
                                                        )}

                                                        {/* Short Answer */}
                                                        {q.question_type === 'short_answer' && q.correct_answer && (
                                                            <div className="mt-2">
                                                                <span className="text-sm text-gray-600">Keywords: <span className="font-medium text-green-700">{q.correct_answer}</span></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <button onClick={() => setAiStep('upload')} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                                                ← Upload Different File
                                            </button>
                                            <button
                                                onClick={handleSaveSelected}
                                                disabled={aiSaving || aiExtractedQuestions.filter(q => q.selected).length === 0}
                                                className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
                                            >
                                                {aiSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckSquare size={18} />}
                                                <span>{aiSaving ? 'Saving...' : `Save ${aiExtractedQuestions.filter(q => q.selected).length} Selected to Question Bank`}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default QuestionBank;
