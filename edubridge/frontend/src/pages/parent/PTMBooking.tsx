import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { CalendarCheck, Plus, CheckCircle, XCircle, User, AlertCircle, Calendar } from 'lucide-react';

interface PTMRequest {
    id: number;
    parent_name: string;
    student_name: string;
    grade: string;
    section: string;
    roll_number: string;
    teacher_name: string;
    teacher_id: number;
    meeting_date: string;
    meeting_time: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'reschedule_requested';
    teacher_remarks?: string;
    rejection_reason?: string;
    alternative_date?: string;
    alternative_time?: string;
    initiator: 'parent' | 'teacher';
    created_at: string;
}

const ParentPTMBooking = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [requests, setRequests] = useState<PTMRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');

    // Form States (Initiate Modal)
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [selectedChild, setSelectedChild] = useState<number | null>(null);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        teacherId: '',
        meetingDate: '',
        meetingTime: '',
        reason: ''
    });

    // Booked Slots State
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    // Action Modal State
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PTMRequest | null>(null);
    const [actionData, setActionData] = useState({
        status: 'approved' as 'approved' | 'rejected',
        rejection_reason: '',
        alternative_date: '',
        alternative_time: ''
    });

    useEffect(() => {
        fetchInitialData();
        fetchBookings();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchTeachers(selectedChild);
        }
    }, [selectedChild]);

    // Fetch booked slots when teacher or date changes
    useEffect(() => {
        if (formData.teacherId && formData.meetingDate) {
            fetchBookedSlots(Number(formData.teacherId), formData.meetingDate);
        } else {
            setBookedSlots([]);
        }
    }, [formData.teacherId, formData.meetingDate]);

    // Local filtering since API might not support it yet, or we can add it later
    const filteredRequests = requests.filter(req => {
        if (!filter) return true;
        return req.status === filter;
    });

    const fetchInitialData = async () => {
        try {
            const dashboardData = await parentAPI.getDashboard();
            setChildren(dashboardData.data.children || []);
            if (dashboardData.data.children?.length > 0) {
                setSelectedChild(dashboardData.data.children[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const response = await parentAPI.getMyPTMs();
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookedSlots = async (teacherId: number, date: string) => {
        try {
            const response = await parentAPI.getBookedSlots(teacherId, date);
            setBookedSlots(response.data);
        } catch (error) {
            console.error('Failed to fetch booked slots:', error);
        }
    };

    const fetchTeachers = async (childId: number) => {
        try {
            const response = await parentAPI.getChildTeachers(childId);
            setTeachers(response.data);
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    };

    const handleInitiateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChild) return;

        try {
            await parentAPI.requestPTM({
                studentId: selectedChild,
                teacherId: formData.teacherId,
                meetingDate: formData.meetingDate,
                meetingTime: formData.meetingTime,
                reason: formData.reason
            });

            // Reset form
            setFormData({ teacherId: '', meetingDate: '', meetingTime: '', reason: '' });
            setShowInitiateModal(false);
            fetchBookings();
            alert('Meeting requested successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to request meeting');
        }
    };

    const handleAlternativeResponse = async (bookingId: number, status: 'approved' | 'rejected') => {
        try {
            await parentAPI.respondToAlternative(bookingId, status);
            fetchBookings();
        } catch (error) {
            console.error('Failed to respond to alternative:', error);
        }
    };

    // Unified handleAction for Approve/Reject buttons
    const handleAction = (request: PTMRequest, action: 'approved' | 'rejected') => {
        if (action === 'approved') {
            if (window.confirm(`Accept meeting on ${new Date(request.meeting_date).toLocaleDateString()} at ${request.meeting_time}?`)) {
                submitAction(request.id, { status: 'approved' });
            }
        } else {
            setSelectedRequest(request);
            setActionData({
                status: 'rejected',
                rejection_reason: '',
                alternative_date: '',
                alternative_time: ''
            });
            setShowActionModal(true);
        }
    };

    const submitAction = async (bookingId: number, data: any) => {
        try {
            await parentAPI.updatePTMStatus(bookingId, data);
            setShowActionModal(false);
            fetchBookings();
            alert(`Meeting ${data.status === 'approved' ? 'Accepted' : 'Rejected'}!`);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update status');
        }
    };

    const handleActionModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;
        submitAction(selectedRequest.id, actionData);
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
                        <span>Book Meeting</span>
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
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                        <CalendarCheck className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p>No meetings found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredRequests.map((request) => (
                            <div key={request.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                            <User className="text-primary-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{request.teacher_name}</h3>
                                            <p className="text-sm text-gray-600">
                                                For Student: {request.student_name}
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
                                            Requested: {new Date(request.meeting_date).toLocaleDateString()} at {request.meeting_time}
                                        </span>
                                    </div>

                                    {request.status === 'reschedule_requested' && request.initiator === 'parent' && (
                                        <div className="bg-blue-50 p-3 rounded-lg mt-2">
                                            <div className="flex items-start space-x-2 text-blue-800 mb-2">
                                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm">Reschedule Proposed by Teacher</p>
                                                    <p className="text-xs mt-1">Reason: {request.rejection_reason}</p>
                                                    <p className="text-xs mt-1 font-semibold">
                                                        New Slot: {new Date(request.alternative_date!).toLocaleDateString()} at {request.alternative_time}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 mt-2">
                                                <button
                                                    onClick={() => handleAlternativeResponse(request.id, 'approved')}
                                                    className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700"
                                                >
                                                    Accept Alternative
                                                </button>
                                                <button
                                                    onClick={() => handleAlternativeResponse(request.id, 'rejected')}
                                                    className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {request.notes && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Initial Note:</span> {request.notes}
                                        </p>
                                    </div>
                                )}

                                {request.teacher_remarks && request.status !== 'pending' && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Teacher Remarks:</span> {request.teacher_remarks}
                                        </p>
                                    </div>
                                )}

                                {request.status === 'pending' && request.initiator === 'teacher' && (
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
                )}

                {/* Initiate Modal */}
                {showInitiateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Book Meeting</h2>
                            <form onSubmit={handleInitiateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Child</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg"
                                        value={selectedChild || ''}
                                        onChange={(e) => setSelectedChild(Number(e.target.value))}
                                        required
                                    >
                                        {children.map(child => (
                                            <option key={child.id} value={child.id}>{child.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg"
                                        value={formData.teacherId}
                                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                        required
                                        disabled={!selectedChild}
                                    >
                                        <option value="">Select a teacher...</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.teacher_id} value={teacher.teacher_id}>
                                                {teacher.full_name} ({teacher.subject}) - {teacher.role}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2 border rounded-lg"
                                            value={formData.meetingDate}
                                            onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg"
                                            value={formData.meetingTime}
                                            onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                                            required
                                        >
                                            <option value="">Select slot...</option>
                                            {[
                                                { value: "13:30", label: "1:30 PM" },
                                                { value: "14:00", label: "2:00 PM" }
                                            ].map(slot => (
                                                <option
                                                    key={slot.value}
                                                    value={slot.value}
                                                    disabled={bookedSlots.includes(slot.value)}
                                                    className={bookedSlots.includes(slot.value) ? 'bg-gray-100 text-gray-400' : ''}
                                                >
                                                    {slot.label} {bookedSlots.includes(slot.value) ? '(Booked)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                                    <textarea
                                        className="w-full px-4 py-2 border rounded-lg"
                                        rows={3}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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

                {/* Rejection/Reschedule Modal */}
                {showActionModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Reject / Reschedule Request</h2>
                            <form onSubmit={handleActionModalSubmit} className="space-y-4">
                                <div className="bg-red-50 p-4 rounded-lg mb-4">
                                    <p className="text-sm text-red-800 font-medium">
                                        You are rejecting the requested time: {selectedRequest.meeting_date ? new Date(selectedRequest.meeting_date).toLocaleDateString() : 'Date not set'} at {selectedRequest.meeting_time || 'Time not set'}.
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
                                    <p className="text-xs text-gray-500 mb-3">If you propose an alternative, the teacher can accept or reject it.</p>

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

                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowActionModal(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Confirm Rejection
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

export default ParentPTMBooking;
