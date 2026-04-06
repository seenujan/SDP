import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { BookOpen, Plus, Calendar, Clock, Award, ArrowRight, ArrowLeft, Check, X, Edit, Eye, Sparkles, FileUp, CheckSquare, Square, Loader2 } from 'lucide-react';

interface Exam {
    id: number;
    title: string;
    subject: string;
    grade: string;
    section?: string;
    class_name: string;
    exam_date: string;
    duration: number;
    total_marks: number;
    question_count: number;
    status: string;
    created_at: string;
}

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
}

const Exams = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState(1); // 1 = Basic Info, 2 = Select Questions
    const [editingExamId, setEditingExamId] = useState<number | null>(null);

    // Dropdown data
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    // Basic exam info
    const [formData, setFormData] = useState({
        title: '',
        subject_id: '',
        class_id: '',
        exam_date: '',
        duration: 60,
    });

    // Selected questions with custom marks
    const [selectedQuestions, setSelectedQuestions] = useState<{ question_id: number, marks: number, question: Question }[]>([]);

    // Question filters
    const [questionFilters, setQuestionFilters] = useState({
        subject: '',
        difficulty_level: '',
        question_type: '',
    });

    // Step 2 tab: 'bank' | 'ai'
    const [step2Tab, setStep2Tab] = useState<'bank' | 'ai'>('bank');

    // AI Extraction state
    const [aiFile, setAiFile] = useState<File | null>(null);
    const [aiInstructions, setAiInstructions] = useState('Generate 5 multiple choice questions, medium difficulty');
    const [aiStep, setAiStep] = useState<'upload' | 'loading' | 'review'>('upload');
    const [aiExtractedQuestions, setAiExtractedQuestions] = useState<any[]>([]);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        fetchExams();
        fetchDropdowns();
    }, []);

    const fetchExams = async () => {
        try {
            const response = await teacherAPI.getExams();
            setExams(response.data);
        } catch (error) {
            console.error('Failed to fetch exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                teacherAPI.getMyClasses(),
                teacherAPI.getAllSubjects()
            ]);
            setClasses(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error('Failed to fetch dropdowns:', error);
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await teacherAPI.getQuestions(questionFilters);
            setQuestions(response.data || []);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        }
    };

    // Load questions when modal opens on step 2
    useEffect(() => {
        if (showModal && step === 2) {
            fetchQuestions();
        }
    }, [showModal, step, questionFilters]);

    // Ensure dropdowns are loaded when modal opens
    useEffect(() => {
        if (showModal && (classes.length === 0 || subjects.length === 0)) {
            fetchDropdowns();
        }
    }, [showModal, classes.length, subjects.length]);

    useEffect(() => {
        if (subjects.length > 0 && !formData.subject_id) {
            // Auto-select the first subject if none selected
            setFormData(prev => ({ ...prev, subject_id: subjects[0].id.toString() }));
        }
    }, [subjects, formData.subject_id]);

    const handleNextStep = () => {
        if (step === 1) {
            // Validate basic info
            if (!formData.title || !formData.subject_id || !formData.class_id || !formData.exam_date) {
                alert('Please fill all required fields');
                return;
            }

            // Auto-filter questions by the selected exam subject
            const selectedSubject = subjects.find(s => s.id.toString() === formData.subject_id);
            if (selectedSubject) {
                setQuestionFilters(prev => ({ ...prev, subject: selectedSubject.subject_name }));
            }

            setStep(2);
        }
    };

    const handlePreviousStep = () => {
        setStep(1);
    };

    const toggleQuestionSelection = (question: Question) => {
        const isSelected = selectedQuestions.find(q => q.question_id === question.id);

        if (isSelected) {
            // Remove from selection
            setSelectedQuestions(selectedQuestions.filter(q => q.question_id !== question.id));
        } else {
            // Add to selection with default marks
            setSelectedQuestions([...selectedQuestions, {
                question_id: question.id,
                marks: question.marks,
                question: question
            }]);
        }
    };

    const updateQuestionMarks = (questionId: number, marks: number) => {
        setSelectedQuestions(selectedQuestions.map(q =>
            q.question_id === questionId ? { ...q, marks } : q
        ));
    };

    const getTotalMarks = () => {
        return selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
    };

    const handleSubmit = async () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        try {
            const examData = {
                title: formData.title,
                class_id: parseInt(formData.class_id),
                subject_id: parseInt(formData.subject_id),
                exam_date: formData.exam_date,
                duration: formData.duration,
                total_marks: getTotalMarks()
            };

            let examId: number;

            if (editingExamId) {
                // Update existing exam
                await teacherAPI.updateExam(editingExamId, examData);
                examId = editingExamId;

                // Remove all existing questions and add new ones
                const questionsData = selectedQuestions.map(q => ({
                    question_id: q.question_id,
                    marks: q.marks
                }));

                // For updates, we'll just add questions (backend should handle duplicates or we replace all)
                await teacherAPI.addQuestionsToExam(examId, questionsData);

                alert('Exam updated successfully!');
            } else {
                // Create new exam
                const createResponse = await teacherAPI.createExam(examData);
                examId = createResponse.data.id;

                // Add questions to exam
                const questionsData = selectedQuestions.map(q => ({
                    question_id: q.question_id,
                    marks: q.marks
                }));
                await teacherAPI.addQuestionsToExam(examId, questionsData);

                alert('Exam created successfully!');
            }

            setShowModal(false);
            resetForm();
            fetchExams();
        } catch (error: any) {
            console.error('Failed to save exam:', error);
            alert(error.response?.data?.error || 'Failed to save exam');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subject_id: '', // Will be reset by useEffect
            class_id: '',
            exam_date: '',
            duration: 60,
        });
        setSelectedQuestions([]);
        setStep(1);
        setEditingExamId(null);
        setQuestionFilters({
            subject: '',
            difficulty_level: '',
            question_type: '',
        });
        setStep2Tab('bank');
        setAiStep('upload');
        setAiFile(null);
        setAiExtractedQuestions([]);
        setAiError('');
    };

    // ── AI Extraction Handlers ─────────────────────────────────────────
    const handleAiExtract = async () => {
        if (!aiFile) { setAiError('Please select a file.'); return; }
        if (!aiInstructions.trim()) { setAiError('Please enter instructions.'); return; }
        setAiStep('loading');
        setAiError('');
        try {
            const fd = new FormData();
            fd.append('file', aiFile);
            fd.append('subject_id', formData.subject_id || '0');
            fd.append('instructions', aiInstructions);
            const response = await teacherAPI.extractQuestionsFromFile(fd);
            const qs = (response.data.questions || []).map((q: any) => ({ ...q, selected: true }));
            if (qs.length === 0) { setAiError('No questions extracted. Try a different file or instructions.'); setAiStep('upload'); return; }
            setAiExtractedQuestions(qs);
            setAiStep('review');
        } catch (err: any) {
            setAiError(err.response?.data?.error || 'AI extraction failed.');
            setAiStep('upload');
        }
    };

    const handleAddAiQuestionsToExam = async () => {
        const selected = aiExtractedQuestions.filter(q => q.selected);
        if (selected.length === 0) { alert('Select at least one question.'); return; }
        setAiSaving(true);
        try {
            // Save to question bank and get their IDs
            const saveRes = await teacherAPI.bulkSaveQuestions(selected, parseInt(formData.subject_id) || 0);
            const savedIds: number[] = saveRes.data.ids || [];

            // Add to exam selected questions using a temp question object
            const newSelected = selected.map((q: any, i: number) => ({
                question_id: savedIds[i] || -(Date.now() + i), // use saved ID
                marks: q.marks || 1,
                question: {
                    id: savedIds[i] || 0,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    subject: subjects.find(s => s.id.toString() === formData.subject_id)?.subject_name || '',
                    topic: q.topic,
                    difficulty_level: q.difficulty_level,
                    marks: q.marks,
                    options: q.options,
                    correct_answer: q.correct_answer,
                }
            }));

            // Merge into selectedQuestions (avoid duplicates)
            setSelectedQuestions(prev => {
                const existingIds = new Set(prev.map(p => p.question_id));
                const toAdd = newSelected.filter(q => !existingIds.has(q.question_id));
                return [...prev, ...toAdd];
            });

            alert(`✅ ${selected.length} question(s) saved to Question Bank and added to exam!`);
            setStep2Tab('bank');
            setAiStep('upload');
            setAiFile(null);
            setAiExtractedQuestions([]);
            // Refresh question bank list
            fetchQuestions();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save questions.');
        } finally {
            setAiSaving(false);
        }
    };

    const handleEdit = async (exam: Exam) => {
        try {
            setEditingExamId(exam.id);

            // Load exam details with questions
            const response = await teacherAPI.getExamById(exam.id);
            const examDetails = response.data;

            // Set basic form data
            // examDetails should include class_id and subject_id from the backend select e.*
            setFormData({
                title: examDetails.title,
                subject_id: examDetails.subject_id.toString(),
                class_id: examDetails.class_id.toString(),
                exam_date: examDetails.exam_date.split('T')[0], // Convert to YYYY-MM-DD format
                duration: examDetails.duration,
            });

            // Set selected questions if any exist
            if (examDetails.questions && examDetails.questions.length > 0) {
                const questions = examDetails.questions.map((q: any) => ({
                    question_id: q.id,
                    marks: q.assigned_marks || q.marks || q.default_marks, // Use assigned_marks from exam_questions table
                    question: {
                        id: q.id,
                        question_text: q.question_text,
                        question_type: q.question_type,
                        subject: q.subject,
                        topic: q.topic,
                        difficulty_level: q.difficulty_level,
                        marks: q.default_marks,
                        options: q.options,
                        correct_answer: q.correct_answer
                    }
                }));
                setSelectedQuestions(questions);
            }

            setShowModal(true);
        } catch (error) {
            console.error('Failed to load exam:', error);
            alert('Failed to load exam details');
        }
    };

    const handlePublish = async (id: number) => {
        if (window.confirm('Are you sure you want to publish this exam? Students will be able to see it.')) {
            try {
                await teacherAPI.publishExam(id);
                fetchExams();
                alert('Exam published successfully!');
            } catch (error: any) {
                console.error('Failed to publish exam:', error);
                alert(error.response?.data?.error || 'Failed to publish exam');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this exam?')) {
            try {
                await teacherAPI.deleteExam(id);
                fetchExams();
            } catch (error) {
                console.error('Failed to delete exam:', error);
            }
        }
    };

    // Filter questions based on selectedFilters
    const filteredQuestions = questions.filter(q => {
        if (questionFilters.subject && q.subject !== questionFilters.subject) return false;
        if (questionFilters.difficulty_level && q.difficulty_level !== questionFilters.difficulty_level) return false;
        if (questionFilters.question_type && q.question_type !== questionFilters.question_type) return false;
        return true;
    });

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
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Exams Management</h1>
                        <p className="text-gray-600 mt-1">Create and manage exams with questions</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                    >
                        <Plus size={20} />
                        <span>Create Exam</span>
                    </button>
                </div>

                {/* Exams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam) => (
                        <div key={exam.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-lg">{exam.title}</h3>
                                    <p className="text-sm text-gray-500">{exam.subject}</p>
                                </div>
                                <div className="flex space-x-2">
                                    {exam.status === 'draft' && (
                                        <>
                                            <button
                                                onClick={() => handlePublish(exam.id)}
                                                className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                                title="Publish Exam"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(exam)}
                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                title="Edit exam"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </>
                                    )}
                                    {exam.status === 'published' && (
                                        <button
                                            onClick={() => navigate(`/teacher/exams/${exam.id}/submissions`)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                            title="View Submissions"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(exam.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        title="Delete exam"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar size={16} className="mr-2" />
                                    <span>{new Date(exam.exam_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock size={16} className="mr-2" />
                                    <span>{exam.duration} minutes</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Award size={16} className="mr-2" />
                                    <span>{exam.total_marks} marks</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <BookOpen size={16} className="mr-2" />
                                    <span>{exam.question_count || 0} questions</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">{exam.class_name}</span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${exam.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {exam.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {exams.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500 mb-4">No exams created yet</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-primary-600 hover:text-primary-700"
                        >
                            Create your first exam
                        </button>
                    </div>
                )}

                {/* Create Exam Modal - Multi-Step */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b px-8 py-6 z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {editingExamId ? 'Edit Exam' : 'Create New Exam'}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {step === 1 ? 'Step 1: Basic Information' : 'Step 2: Select Questions'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                                            {step > 1 ? <Check size={16} /> : '1'}
                                        </div>
                                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                                            2
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8">
                                {/* Step 1: Basic Info */}
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Exam Title *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                    placeholder="e.g., Mid-Term Exam"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Subject *
                                                </label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={
                                                        subjects.find(s => s.id.toString() === formData.subject_id)?.subject_name || 
                                                        (subjects.length > 0 ? subjects[0].subject_name : 'Loading...')
                                                    }
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Class *
                                                </label>
                                                <select
                                                    required
                                                    value={formData.class_id}
                                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="">Select Class</option>
                                                    {classes.map((cls, idx) => (
                                                        <option key={`${cls.id}-${idx}`} value={cls.id}>
                                                            {cls.class_name} ({cls.student_count || 0} students)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Exam Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.exam_date}
                                                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Duration (minutes) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={formData.duration}
                                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Select Questions */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        {/* Tab Bar */}
                                        <div className="flex border-b border-gray-200">
                                            <button
                                                onClick={() => setStep2Tab('bank')}
                                                className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                                    step2Tab === 'bank'
                                                        ? 'border-primary-600 text-primary-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <BookOpen size={16} />
                                                <span>From Question Bank</span>
                                            </button>
                                            <button
                                                onClick={() => { setStep2Tab('ai'); setAiStep('upload'); setAiError(''); }}
                                                className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                                    step2Tab === 'ai'
                                                        ? 'border-purple-600 text-purple-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <Sparkles size={16} />
                                                <span>Extract from File (AI)</span>
                                            </button>
                                        </div>

                                        {/* ── TAB: QUESTION BANK ── */}
                                        {step2Tab === 'bank' && (
                                        <div className="space-y-4">
                                        {/* Question Filters */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-medium text-gray-800 mb-3">Filter Questions</h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                <select
                                                    value={questionFilters.subject}
                                                    onChange={(e) => setQuestionFilters({ ...questionFilters, subject: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-100"
                                                    disabled={true}
                                                >
                                                    <option value="">All Subjects</option>
                                                    {subjects.map((sub) => (
                                                        <option key={sub.id} value={sub.subject_name}>
                                                            {sub.subject_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={questionFilters.difficulty_level}
                                                    onChange={(e) => setQuestionFilters({ ...questionFilters, difficulty_level: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="">All Difficulties</option>
                                                    <option value="easy">Easy</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="hard">Hard</option>
                                                </select>
                                                <select
                                                    value={questionFilters.question_type}
                                                    onChange={(e) => setQuestionFilters({ ...questionFilters, question_type: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="">All Types</option>
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="true_false">True/False</option>
                                                    <option value="short_answer">Short Answer</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Question Bank */}
                                            <div>
                                                <h3 className="font-medium text-gray-800 mb-3">
                                                    Question Bank ({filteredQuestions.length})
                                                </h3>
                                                <div className="border rounded-lg max-h-96 overflow-y-auto">
                                                    {filteredQuestions.map((question) => {
                                                        const isSelected = selectedQuestions.find(q => q.question_id === question.id);
                                                        return (
                                                            <div
                                                                key={question.id}
                                                                onClick={() => toggleQuestionSelection(question)}
                                                                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-start space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!isSelected}
                                                                        onChange={() => { }}
                                                                        className="mt-1"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-gray-800">
                                                                            {question.question_text}
                                                                        </p>
                                                                        <div className="flex items-center space-x-2 mt-1">
                                                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                                                                {question.question_type.replace('_', ' ')}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {question.marks} marks
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {filteredQuestions.length === 0 && (
                                                        <div className="p-8 text-center text-gray-500">
                                                            No questions found. Try adjusting filters.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selected Questions */}
                                            <div>
                                                <h3 className="font-medium text-gray-800 mb-3">
                                                    Selected Questions ({selectedQuestions.length})
                                                </h3>
                                                <div className="border rounded-lg max-h-96 overflow-y-auto">
                                                    {selectedQuestions.map((sq, index) => (
                                                        <div key={sq.question_id} className="p-3 border-b">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        {index + 1}. {sq.question.question_text}
                                                                    </p>
                                                                    <div className="flex items-center space-x-3 mt-2">
                                                                        <label className="text-xs text-gray-600">Marks:</label>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={sq.marks}
                                                                            onChange={(e) => updateQuestionMarks(sq.question_id, parseInt(e.target.value))}
                                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleQuestionSelection(sq.question)}
                                                                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {selectedQuestions.length === 0 && (
                                                        <div className="p-8 text-center text-gray-500">
                                                            Select questions from the left
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedQuestions.length > 0 && (
                                                    <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium text-gray-800">Total Marks</span>
                                                            <span className="text-2xl font-bold text-primary-600">
                                                                {getTotalMarks()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        </div>
                                        )}

                                        {/* ── TAB: AI EXTRACT ── */}
                                        {step2Tab === 'ai' && (
                                        <div className="space-y-5">
                                            {aiError && (
                                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{aiError}</div>
                                            )}

                                            {/* UPLOAD STATE */}
                                            {aiStep === 'upload' && (
                                            <div className="space-y-4">
                                                <div
                                                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
                                                    onClick={() => document.getElementById('exam-ai-file-input')?.click()}
                                                >
                                                    <FileUp size={28} className="mx-auto text-gray-400 mb-2" />
                                                    {aiFile ? (
                                                        <div>
                                                            <p className="font-medium text-gray-800">{aiFile.name}</p>
                                                            <p className="text-sm text-gray-500">{(aiFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-gray-600 font-medium">Click to upload lesson file</p>
                                                            <p className="text-sm text-gray-400 mt-1">PDF, PPT, PPTX, TXT — max 15MB</p>
                                                        </div>
                                                    )}
                                                    <input id="exam-ai-file-input" type="file" accept=".pdf,.ppt,.pptx,.txt" className="hidden" onChange={(e) => setAiFile(e.target.files?.[0] || null)} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions for AI</label>
                                                    <textarea rows={2} value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" placeholder="e.g., Generate 10 MCQ questions, medium difficulty, Chapter 2" />
                                                </div>
                                                <button onClick={handleAiExtract} disabled={!aiFile} className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium">
                                                    <Sparkles size={18} />
                                                    <span>Extract Questions with AI</span>
                                                </button>
                                            </div>
                                            )}

                                            {/* LOADING STATE */}
                                            {aiStep === 'loading' && (
                                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <Loader2 size={30} className="text-purple-600 animate-spin" />
                                                </div>
                                                <p className="text-lg font-semibold text-gray-800">AI is reading your file...</p>
                                                <p className="text-gray-500 text-sm">This may take 15–30 seconds.</p>
                                            </div>
                                            )}

                                            {/* REVIEW STATE */}
                                            {aiStep === 'review' && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm text-gray-600">{aiExtractedQuestions.filter(q => q.selected).length} of {aiExtractedQuestions.length} selected</p>
                                                    <button onClick={() => setAiExtractedQuestions(prev => prev.map(q => ({ ...q, selected: !prev.every(q => q.selected) })))} className="text-sm text-purple-600 font-medium">
                                                        {aiExtractedQuestions.every(q => q.selected) ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                </div>
                                                <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                                                    {aiExtractedQuestions.map((q, idx) => (
                                                        <div key={idx} className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${q.selected ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`} onClick={() => setAiExtractedQuestions(prev => prev.map((x, i) => i === idx ? { ...x, selected: !x.selected } : x))}>
                                                            <div className="flex items-start space-x-3">
                                                                <div className="mt-0.5 flex-shrink-0">
                                                                    {q.selected ? <CheckSquare size={20} className="text-purple-600" /> : <Square size={20} className="text-gray-400" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                            q.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                                                                            q.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                                        }`}>{q.difficulty_level?.toUpperCase()}</span>
                                                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">{q.question_type?.replace('_',' ').toUpperCase()}</span>
                                                                        <span className="text-xs text-primary-600 font-medium">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                    <p className="text-sm font-medium text-gray-800">{q.question_text}</p>
                                                                    {q.question_type === 'multiple_choice' && q.options?.length > 0 && (
                                                                        <div className="mt-2 space-y-0.5">
                                                                            {q.options.map((opt: string, oi: number) => (
                                                                                <p key={oi} className={`text-xs ${opt === q.correct_answer ? 'text-green-700 font-semibold' : 'text-gray-600'}`}>
                                                                                    {String.fromCharCode(65+oi)}. {opt} {opt === q.correct_answer ? '✓' : ''}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <button onClick={() => { setAiStep('upload'); setAiFile(null); }} className="text-sm text-gray-500 hover:text-gray-700">← Change file</button>
                                                    <button
                                                        onClick={handleAddAiQuestionsToExam}
                                                        disabled={aiSaving || aiExtractedQuestions.filter(q => q.selected).length === 0}
                                                        className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 text-sm font-medium"
                                                    >
                                                        {aiSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                                                        <span>{aiSaving ? 'Saving...' : `Add ${aiExtractedQuestions.filter(q => q.selected).length} to Exam`}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-white border-t px-8 py-4 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <div className="flex space-x-3">
                                    {step === 2 && (
                                        <button
                                            onClick={handlePreviousStep}
                                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                        >
                                            <ArrowLeft size={16} />
                                            <span>Previous</span>
                                        </button>
                                    )}
                                    {step === 1 ? (
                                        <button
                                            onClick={handleNextStep}
                                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                                        >
                                            <span>Next: Add Questions</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                                        >
                                            <Check size={16} />
                                            <span>{editingExamId ? 'Update Exam' : 'Create Exam'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout >
    );
};

export default Exams;
