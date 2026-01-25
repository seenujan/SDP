import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { User, CheckCircle, XCircle, Calendar, Plus, AlertCircle } from 'lucide-react';

interface PTMRequest {
    id: number;
    parent_name: string;
    student_name: string;
    grade: string;
    section: string;
    roll_number: string;
    parent_email: string;
    parent_phone: string;
    meeting_date: string; // Changed from preferred_date
    meeting_time: string; // Changed from preferred_time
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'reschedule_requested';
    approved_date?: string;
    approved_time?: string;
    teacher_remarks?: string;
    rejection_reason?: string;
    alternative_date?: string;
    alternative_time?: string;
    initiator: 'parent' | 'teacher';
    created_at: string;
}

const PTMBooking = () => {
    const [requests, setRequests] = useState<PTMRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');

    // Action Modal State
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PTMRequest | null>(null);
    const [actionData, setActionData] = useState({
        status: 'approved' as 'approved' | 'rejected',
        approved_date: '',
        approved_time: '',
        teacher_remarks: '',
        rejection_reason: '',
        alternative_date: '',
        alternative_time: ''
    });

    // Initiate Modal State
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [initiateData, setInitiateData] = useState({
        classId: '',
        studentId: '',
        parentId: '', // Will be set automatically when student is selected
        meetingDate: '',
        meetingTime: '',
        notes: ''
    });

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    useEffect(() => {
        if (showInitiateModal) {
            fetchClasses();
        }
    }, [showInitiateModal]);

    useEffect(() => {
        if (initiateData.classId) {
            fetchStudents(parseInt(initiateData.classId));
        }
    }, [initiateData.classId]);

    const fetchRequests = async () => {
        try {
            const response = await teacherAPI.getPTMRequests(filter);
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch PTM requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await teacherAPI.getMyClasses();
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchStudents = async (classId: number) => {
        try {
            const response = await teacherAPI.getClassStudents(classId);
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    };

    const handleAction = (request: PTMRequest, action: 'approved' | 'rejected') => {
        setSelectedRequest(request);
        setActionData({
            status: action,
            approved_date: action === 'approved' ? (request.meeting_date ? request.meeting_date.split('T')[0] : '') : '',
            approved_time: action === 'approved' ? request.meeting_time : '',
            teacher_remarks: '',
            rejection_reason: '',
            alternative_date: '',
            alternative_time: ''
        });
        setShowActionModal(true);
    };

    const handleActionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        try {
            await teacherAPI.updatePTMStatus(selectedRequest.id, actionData);
            setShowActionModal(false);
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error('Failed to update PTM status:', error);
        }
    };

    const handleInitiateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Find parentId from student list
        const selectedStudent = students.find(s => s.id === parseInt(initiateData.studentId));
        if (!selectedStudent || !selectedStudent.parent_id) {
            alert('Selected student does not have a linked parent account.');
            return;
        }

        try {
            await teacherAPI.initiatePTM({
                ...initiateData,
                parentId: selectedStudent.parent_id
            });
            setShowInitiateModal(false);
            setInitiateData({
                classId: '',
                studentId: '',
                parentId: '',
                meetingDate: '',
                meetingTime: '',
                notes: ''
            });
            fetchRequests();
            alert('PTM Request Sent!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to initiate PTM');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800',
            reschedule_requested: 'bg-purple-100 text-purple-800'
        };
        return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">PTM Booking</h1>
                        <p className="text-gray-600 mt-1">Manage Parent-Teacher Meeting requests</p>
                    </div>
                    <button
                        onClick={() => setShowInitiateModal(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus size={20} />
                        <span>Initiate Meeting</span>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {['', 'pending', 'approved', 'rejected', 'completed', 'reschedule_requested'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg transition-colors capitalize ${filter === status ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                {status || 'All Requests'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Requests Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                        <User className="text-primary-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{request.parent_name}</h3>
                                        <p className="text-sm text-gray-600">
                                            Parent of {request.student_name}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusBadge(request.status)}`}>
                                    {request.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium mr-2">Initiated by:</span> {request.initiator}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar size={16} className="mr-2" />
                                    <span>
                                        Preferred: {new Date(request.meeting_date).toLocaleDateString()} at {request.meeting_time}
                                    </span>
                                </div>
                                {request.status === 'reschedule_requested' && (
                                    <div className="flex items-center text-sm text-purple-600 font-medium">
                                        <AlertCircle size={16} className="mr-2" />
                                        <span>
                                            Proposed Alternative: {new Date(request.alternative_date!).toLocaleDateString()} at {request.alternative_time}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {request.notes && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Note:</span> {request.notes}
                                    </p>
                                </div>
                            )}

                            {request.status === 'pending' && request.initiator === 'parent' && (
                                <div className="flex space-x-3 mt-4">
                                    <button
                                        onClick={() => handleAction(request, 'approved')}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <CheckCircle size={18} />
                                        <span>Approve</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(request, 'rejected')}
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <XCircle size={18} />
                                        <span>Reject</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Initiate Modal */}
                {showInitiateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Initiate PTM</h2>
                            <form onSubmit={handleInitiateSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg"
                                            value={initiateData.classId}
                                            onChange={(e) => setInitiateData({ ...initiateData, classId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.grade} - {c.section}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg"
                                            value={initiateData.studentId}
                                            onChange={(e) => setInitiateData({ ...initiateData, studentId: e.target.value })}
                                            required
                                            disabled={!initiateData.classId}
                                        >
                                            <option value="">Select Student</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2 border rounded-lg"
                                            value={initiateData.meetingDate}
                                            onChange={(e) => setInitiateData({ ...initiateData, meetingDate: e.target.value })}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg"
                                            value={initiateData.meetingTime}
                                            onChange={(e) => setInitiateData({ ...initiateData, meetingTime: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Slot</option>
                                            <option value="13:30">1:30 PM</option>
                                            <option value="14:00">2:00 PM</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Note to Parent</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        value={initiateData.notes}
                                        onChange={(e) => setInitiateData({ ...initiateData, notes: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowInitiateModal(false)}
                                        className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


                {/* Action Modal */}
                {showActionModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {actionData.status === 'approved' ? 'Approve PTM Request' : 'Reject / Reschedule Request'}
                            </h2>
                            <form onSubmit={handleActionSubmit} className="space-y-4">
                                {actionData.status === 'approved' ? (
                                    // Approval Form
                                    <>
                                        <div>
                                            <p className="text-gray-600 mb-4">Confirm meeting details:</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        readOnly
                                                        className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                                                        value={actionData.approved_date}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                                    <input
                                                        type="time"
                                                        readOnly
                                                        className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                                                        value={actionData.approved_time}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                                            <textarea
                                                rows={3}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                value={actionData.teacher_remarks}
                                                onChange={(e) => setActionData({ ...actionData, teacher_remarks: e.target.value })}
                                                placeholder="Optional remarks..."
                                            />
                                        </div>
                                    </>
                                ) : (
                                    // Rejection / Reschedule Form
                                    <>
                                        <div className="bg-red-50 p-4 rounded-lg mb-4">
                                            <p className="text-sm text-red-800 font-medium">
                                                You are rejecting the requested time: {new Date(selectedRequest.meeting_date).toLocaleDateString()} at {selectedRequest.meeting_time}.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection *</label>
                                            <textarea
                                                rows={2}
                                                required
                                                className="w-full px-4 py-2 border rounded-lg"
                                                value={actionData.rejection_reason}
                                                onChange={(e) => setActionData({ ...actionData, rejection_reason: e.target.value })}
                                                placeholder="Why is this slot not suitable?"
                                            />
                                        </div>

                                        <div className="mt-4 border-t pt-4">
                                            <p className="font-medium text-gray-800 mb-2">Propose Alternative Slot (Optional)</p>
                                            <p className="text-xs text-gray-500 mb-3">If you propose an alternative, the parent can accept or reject it.</p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                        value={actionData.alternative_date}
                                                        onChange={(e) => setActionData({ ...actionData, alternative_date: e.target.value })}
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Time</label>
                                                    <select
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                        value={actionData.alternative_time}
                                                        onChange={(e) => setActionData({ ...actionData, alternative_time: e.target.value })}
                                                    >
                                                        <option value="">Select Slot</option>
                                                        <option value="13:30">1:30 PM</option>
                                                        <option value="14:00">2:00 PM</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowActionModal(false);
                                            setSelectedRequest(null);
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`px-6 py-2 rounded-lg text-white transition-colors ${actionData.status === 'approved'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                            }`}
                                    >
                                        {actionData.status === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
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

export default PTMBooking;
