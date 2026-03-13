
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TeacherLeave } from '../../types/leave';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search } from 'lucide-react';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import RejectionModal from '../../components/common/RejectionModal';
import Toast, { ToastType } from '../../components/common/Toast';

const LeaveApproval: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [pendingLeaves, setPendingLeaves] = useState<TeacherLeave[]>([]);
    const [historyLeaves, setHistoryLeaves] = useState<TeacherLeave[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');

    // UI State
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    // Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

    useEffect(() => {
        // Reset filters when tab changes
        setSearchTerm('');
        setStatusFilter('all');
        if (activeTab === 'pending') fetchPending();
        else fetchHistory();
    }, [activeTab]);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
    };

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/leave/pending');
            setPendingLeaves(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/leave/all');
            setHistoryLeaves(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAction = async (leaveId: number, status: 'approved' | 'rejected') => {
        if (status === 'rejected') {
            setSelectedLeaveId(leaveId);
            setShowRejectModal(true);
            return;
        }

        if (status === 'approved') {
            setSelectedLeaveId(leaveId);
            setShowApproveModal(true);
        }
    };

    const confirmApproveLeave = async () => {
        if (!selectedLeaveId) return;
        await submitStatusUpdate(selectedLeaveId, 'approved', null);
        setShowApproveModal(false);
    };

    const confirmRejectLeave = async (reason: string) => {
        if (!selectedLeaveId) return;
        await submitStatusUpdate(selectedLeaveId, 'rejected', reason);
        setShowRejectModal(false);
    };

    const submitStatusUpdate = async (leaveId: number, status: 'approved' | 'rejected', reason: string | null) => {
        try {
            await api.put('/admin/leave/status', {
                leaveId,
                status,
                rejectionReason: reason
            });
            showToast(`Leave ${status} successfully`, 'success');

            fetchPending(); // Refresh pending list if we were there
            if (activeTab === 'history') fetchHistory();
        } catch (err) {
            showToast('Failed to update status', 'error');
            console.error(err);
        }
    };

    // Cancellation Logic (For Approved Leaves)
    const [showCancelModal, setShowCancelModal] = useState(false);

    const initiateCancelLeave = (leaveId: number) => {
        setSelectedLeaveId(leaveId);
        setShowCancelModal(true);
    };

    const confirmCancelLeaveAction = async () => {
        if (!selectedLeaveId) return;
        try {
            await api.put(`/admin/leave/${selectedLeaveId}/cancel`);
            showToast('Leave cancelled successfully', 'success');
            fetchHistory();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to cancel leave', 'error');
        } finally {
            setShowCancelModal(false);
            setSelectedLeaveId(null);
        }
    };

    // Filtering Logic
    const getFilteredLeaves = () => {
        const source = activeTab === 'pending' ? pendingLeaves : historyLeaves;
        return source.filter(leave => {
            const matchesSearch =
                (leave.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                (leave.class_names?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

            const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;

            // Strict Filter: History tab should NOT show 'pending' if backend returns it (redundancy check)
            // But if user wants to see "everything" in history, maybe keeping pending is okay?
            // User request: "pendings no need to be here". So we filter OUT pending from history tab.
            const isNotPendingInHistory = activeTab === 'history' ? leave.status !== 'pending' : true;

            return matchesSearch && matchesStatus && isNotPendingInHistory;
        });
    };

    const filteredLeaves = getFilteredLeaves();

    return (
        <DashboardLayout>
            <div className="animate-fade-in relative">
                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}

                {/* Approve Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showApproveModal}
                    onClose={() => setShowApproveModal(false)}
                    onConfirm={confirmApproveLeave}
                    title="Approve Leave Application"
                    message="Approving this will automatically CANCEL any conflicting PTM meetings if they exist. Are you sure you want to proceed?"
                    confirmText="Yes, Approve"
                    cancelText="Cancel"
                    type="warning"
                />

                {/* Cancel Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={confirmCancelLeaveAction}
                    title="Cancel Approved Leave"
                    message="Are you sure you want to cancel this approved leave? This will notify the teacher."
                    confirmText="Yes, Cancel Leave"
                    cancelText="No, Keep It"
                    type="danger"
                />

                {/* Reject Modal */}
                <RejectionModal
                    isOpen={showRejectModal}
                    onClose={() => setShowRejectModal(false)}
                    onConfirm={confirmRejectLeave}
                    title="Reject Leave Request"
                />

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Leave Approval</h1>
                        <p className="text-gray-600 mt-1">Review and manage teacher leave applications</p>
                    </div>

                    {/* Filters Section */}
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search teacher or class..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>

                        {activeTab === 'history' && (
                            <select
                                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200 mb-0">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`${activeTab === 'pending'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Pending Approvals
                            {pendingLeaves.length > 0 && (
                                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                                    {pendingLeaves.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`${activeTab === 'history'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Leave History
                        </button>
                    </nav>
                </div>

                <div className="bg-white rounded-b-lg shadow-sm overflow-hidden mb-8">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relief Teacher</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {activeTab === 'pending' ? 'Actions' : 'Status'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={7}>Loading...</td></tr>
                            ) : filteredLeaves.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No records found</td>
                                </tr>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{leave.teacher_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {leave.class_names || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {leave.leave_type_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                            {leave.is_half_day && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">Half Day</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium bg-yellow-50">
                                            <div>{leave.relief_teacher_name || '-'}</div>
                                            <div className={`text-xs ${leave.relief_status === 'Approved' ? 'text-green-600' :
                                                leave.relief_status === 'Rejected' ? 'text-red-600' :
                                                    'text-yellow-600'
                                                }`}>
                                                ({leave.relief_status || 'Pending'})
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {activeTab === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(leave.id, 'approved')}
                                                        disabled={leave.relief_status !== 'Approved'}
                                                        className={`mr-4 font-bold ${leave.relief_status === 'Approved'
                                                            ? 'text-green-600 hover:text-green-900'
                                                            : 'text-gray-400 cursor-not-allowed'
                                                            }`}
                                                        title={leave.relief_status !== 'Approved' ? "Relief teacher must accept first" : "Approve leave"}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(leave.id, 'rejected')}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                                    </span>
                                                    {leave.status === 'approved' && (
                                                        <button
                                                            onClick={() => initiateCancelLeave(leave.id)}
                                                            className="ml-3 text-red-600 hover:text-red-900 text-xs font-bold border border-red-200 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
                                                            title="Cancel this approved leave"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {leave.status === 'cancelled' && (
                                                        <div className="text-xs text-gray-500 mt-1 font-medium">
                                                            {leave.cancelled_by_role === 'admin'
                                                                ? 'Cancelled by Admin'
                                                                : leave.cancelled_by_name
                                                                    ? `Cancelled by ${leave.cancelled_by_name}`
                                                                    : 'Cancelled'}
                                                        </div>
                                                    )}
                                                </>)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout >
    );
};

export default LeaveApproval;
