import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { CalendarCheck, User, Phone, Mail, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface PTMRequest {
    id: number;
    parent_name: string;
    student_name: string;
    grade: string;
    section: string;
    roll_number: string;
    parent_email: string;
    parent_phone: string;
    preferred_date: string;
    preferred_time: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    approved_date?: string;
    approved_time?: string;
    teacher_remarks?: string;
    created_at: string;
}

const PTMBooking = () => {
    const [requests, setRequests] = useState<PTMRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PTMRequest | null>(null);
    const [actionData, setActionData] = useState({
        status: 'approved' as 'approved' | 'rejected',
        approved_date: '',
        approved_time: '',
        teacher_remarks: '',
    });

    useEffect(() => {
        fetchRequests();
    }, [filter]);

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

    const handleAction = (request: PTMRequest, action: 'approved' | 'rejected') => {
        setSelectedRequest(request);
        setActionData({
            status: action,
            approved_date: action === 'approved' ? request.preferred_date.split('T')[0] : '',
            approved_time: action === 'approved' ? request.preferred_time : '',
            teacher_remarks: '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        try {
            await teacherAPI.updatePTMStatus(selectedRequest.id, actionData);
            setShowModal(false);
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error('Failed to update PTM status:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800',
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">PTM Booking</h1>
                    <p className="text-gray-600 mt-1">Manage Parent-Teacher Meeting requests</p>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setFilter('')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filter === '' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            All Requests
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'pending' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'approved' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Approved
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'rejected' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Rejected
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'completed' ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Completed
                        </button>
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
                                            Parent of {request.student_name} ({request.roll_number})
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                                    {request.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail size={16} className="mr-2" />
                                    <span>{request.parent_email}</span>
                                </div>
                                {request.parent_phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone size={16} className="mr-2" />
                                        <span>{request.parent_phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar size={16} className="mr-2" />
                                    <span>
                                        Preferred: {new Date(request.preferred_date).toLocaleDateString()} at {request.preferred_time}
                                    </span>
                                </div>
                                {request.approved_date && request.status === 'approved' && (
                                    <div className="flex items-center text-sm text-green-600 font-medium">
                                        <CheckCircle size={16} className="mr-2" />
                                        <span>
                                            Scheduled: {new Date(request.approved_date).toLocaleDateString()} at {request.approved_time}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {request.reason && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Reason:</span> {request.reason}
                                    </p>
                                </div>
                            )}

                            {request.teacher_remarks && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Your Remarks:</span> {request.teacher_remarks}
                                    </p>
                                </div>
                            )}

                            {request.status === 'pending' && (
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

                            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                                Requested on {new Date(request.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>

                {requests.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <CalendarCheck className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">No PTM requests found</p>
                    </div>
                )}

                {/* Action Modal */}
                {showModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {actionData.status === 'approved' ? 'Approve PTM Request' : 'Reject PTM Request'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Parent:</span> {selectedRequest.parent_name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Student:</span> {selectedRequest.student_name} ({selectedRequest.roll_number})
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Preferred Date:</span>{' '}
                                        {new Date(selectedRequest.preferred_date).toLocaleDateString()} at {selectedRequest.preferred_time}
                                    </p>
                                </div>

                                {actionData.status === 'approved' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Meeting Date *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={actionData.approved_date}
                                                onChange={(e) => setActionData({ ...actionData, approved_date: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Meeting Time *
                                            </label>
                                            <input
                                                type="time"
                                                required
                                                value={actionData.approved_time}
                                                onChange={(e) => setActionData({ ...actionData, approved_time: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remarks {actionData.status === 'rejected' && '*'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        required={actionData.status === 'rejected'}
                                        value={actionData.teacher_remarks}
                                        onChange={(e) => setActionData({ ...actionData, teacher_remarks: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder={
                                            actionData.status === 'approved'
                                                ? 'Optional remarks for the parent...'
                                                : 'Please provide a reason for rejection...'
                                        }
                                    />
                                </div>

                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
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
                                        {actionData.status === 'approved' ? 'Approve Request' : 'Reject Request'}
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
