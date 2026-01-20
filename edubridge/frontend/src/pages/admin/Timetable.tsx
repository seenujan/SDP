import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { Plus, X, Edit2, Trash2, Clock } from 'lucide-react';

interface TimetableEntry {
    id: number;
    class_id: number;
    subject: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    teacher_id: number;
    grade?: string;
    section?: string;
    class_name?: string;
    teacher_name?: string;
}

interface ClassOption {
    id: number;
    grade: string;
    section: string;
}

interface TeacherOption {
    id: number;
    full_name: string;
    subject: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
];

const Timetable = () => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        classId: '',
        subject: '',
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        teacherId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetableByClass(selectedClass);
        } else {
            fetchAllTimetable();
        }
    }, [selectedClass]);

    const fetchData = async () => {
        try {
            const [classesRes, teachersRes, timetableRes] = await Promise.all([
                adminAPI.getClasses(),
                adminAPI.getTeachersDropdown(),
                adminAPI.getTimetable(),
            ]);
            setClasses(classesRes.data);
            setTeachers(teachersRes.data);
            setTimetable(timetableRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTimetable = async () => {
        try {
            const response = await adminAPI.getTimetable();
            setTimetable(response.data);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        }
    };

    const fetchTimetableByClass = async (classId: number) => {
        try {
            const response = await adminAPI.getTimetableByClass(classId);
            setTimetable(response.data);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            classId: selectedClass?.toString() || '',
            subject: '',
            dayOfWeek: 'Monday',
            startTime: '08:00',
            endTime: '09:00',
            teacherId: ''
        });
        setError('');
    };

    // Create Timetable Entry
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await adminAPI.createTimetable({
                ...formData,
                classId: parseInt(formData.classId),
                teacherId: parseInt(formData.teacherId)
            });
            setShowAddModal(false);
            resetForm();
            if (selectedClass) {
                fetchTimetableByClass(selectedClass);
            } else {
                fetchAllTimetable();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create timetable entry');
        } finally {
            setSubmitting(false);
        }
    };

    // Open Edit Modal
    const openEditModal = (entry: TimetableEntry) => {
        setSelectedEntry(entry);
        setFormData({
            classId: entry.class_id.toString(),
            subject: entry.subject,
            dayOfWeek: entry.day_of_week,
            startTime: entry.start_time.slice(0, 5),
            endTime: entry.end_time.slice(0, 5),
            teacherId: entry.teacher_id.toString()
        });
        setShowEditModal(true);
    };

    // Update Timetable Entry
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEntry) return;
        setSubmitting(true);
        setError('');
        try {
            await adminAPI.updateTimetable(selectedEntry.id, {
                ...formData,
                classId: parseInt(formData.classId),
                teacherId: parseInt(formData.teacherId)
            });
            setShowEditModal(false);
            setSelectedEntry(null);
            resetForm();
            if (selectedClass) {
                fetchTimetableByClass(selectedClass);
            } else {
                fetchAllTimetable();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update timetable entry');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Timetable Entry
    const handleDelete = async () => {
        if (!selectedEntry) return;
        setSubmitting(true);
        try {
            await adminAPI.deleteTimetable(selectedEntry.id);
            setShowDeleteModal(false);
            setSelectedEntry(null);
            if (selectedClass) {
                fetchTimetableByClass(selectedClass);
            } else {
                fetchAllTimetable();
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete timetable entry');
        } finally {
            setSubmitting(false);
        }
    };

    // Format time
    const formatTime = (time: string) => {
        return time.slice(0, 5);
    };

    // Render Form Fields
    const renderFormFields = () => (
        <>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.grade} {c.section}</option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Mathematics"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
                <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    {DAYS.map((day) => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <select
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <select
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.subject})</option>
                    ))}
                </select>
            </div>
        </>
    );

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Timetable Management</h1>
                        <p className="text-gray-600 mt-1">Manage class schedules</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        Add Schedule
                    </button>
                </div>

                {/* Class Filter */}
                <div className="mb-6 flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
                    <select
                        value={selectedClass || ''}
                        onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Classes</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.grade} {c.section}</option>
                        ))}
                    </select>
                </div>

                {/* Timetable Table */}
                {loading ? (
                    <div className="text-center py-12"><p className="text-gray-500">Loading...</p></div>
                ) : timetable.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No schedule entries yet</p>
                        <p className="text-sm text-gray-400 mt-2">Click "Add Schedule" to create one</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                                    {!selectedClass && (
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                                    )}
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teacher</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {timetable.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                            {entry.day_of_week}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                            {entry.subject}
                                        </td>
                                        {!selectedClass && (
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {entry.grade} {entry.section}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-sm text-primary-600 font-medium">
                                            {entry.teacher_name || 'No Teacher'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => openEditModal(entry)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedEntry(entry); setShowDeleteModal(true); }}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Add Schedule</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                            </div>
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
                            <form onSubmit={handleCreate}>
                                {renderFormFields()}
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                        {submitting ? 'Creating...' : 'Create Schedule'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedEntry && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Edit Schedule</h2>
                                <button onClick={() => { setShowEditModal(false); setSelectedEntry(null); }} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                            </div>
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
                            <form onSubmit={handleUpdate}>
                                {renderFormFields()}
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button type="button" onClick={() => { setShowEditModal(false); setSelectedEntry(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                        {submitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && selectedEntry && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg w-full max-w-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Delete Schedule</h2>
                            <p className="text-gray-600 mb-2">Are you sure you want to delete this schedule entry?</p>
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="font-medium">{selectedEntry.subject}</p>
                                <p className="text-sm text-gray-500">{selectedEntry.day_of_week}, {formatTime(selectedEntry.start_time)} - {formatTime(selectedEntry.end_time)}</p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => { setShowDeleteModal(false); setSelectedEntry(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button onClick={handleDelete} disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                                    {submitting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Timetable;
