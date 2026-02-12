
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import { LeaveType, LeaveBalance, TeacherLeave, LeaveApplicationPayload } from '../../types/leave';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import RejectionModal from '../../components/common/RejectionModal';
import Toast, { ToastType } from '../../components/common/Toast';

const LeaveManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'my-leaves' | 'relief-requests'>('my-leaves');
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [history, setHistory] = useState<TeacherLeave[]>([]);
    const [reliefRequests, setReliefRequests] = useState<TeacherLeave[]>([]);
    const [types, setTypes] = useState<LeaveType[]>([]);
    const [teachers, setTeachers] = useState<{ id: number, full_name: string }[]>([]); // For relief dropdown

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<LeaveApplicationPayload>({
        leave_type_id: 0,
        start_date: '',
        end_date: '',
        is_half_day: false,
        reason: '',
        relief_teacher_id: 0
    });

    // UI States
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    // Cancellation Modal State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Common Data
            try {
                const balanceRes = await api.get('/teacher/leave/balance');
                setBalances(balanceRes.data);
            } catch (e) { console.error('Failed to fetch balance', e); }

            try {
                const typesRes = await api.get('/teacher/leave/types');
                setTypes(typesRes.data);
            } catch (e) { console.error('Failed to fetch leave types', e); }

            // Fetch History
            try {
                const historyRes = await api.get('/teacher/leave/history');
                setHistory(historyRes.data);
            } catch (e) { console.error('Failed to fetch history', e); }

            // Fetch Relief Requests
            try {
                const reliefRes = await api.get('/teacher/leave/relief-requests');
                setReliefRequests(reliefRes.data);
            } catch (e) { console.error('Failed to fetch relief requests', e); }

        } catch (error) {
            console.error('Error in fetchData:', error);
            showToast('Failed to load some data. Please refresh.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Dynamic Relief Teacher Query
    useEffect(() => {
        const fetchReliefTeachers = async () => {
            if (!formData.start_date || !formData.end_date) {
                setTeachers([]);
                return;
            }
            try {
                const res = await api.get('/teacher/leave/available-relief', {
                    params: {
                        startDate: formData.start_date,
                        endDate: formData.end_date
                    }
                });
                setTeachers(res.data);
            } catch (err) {
                console.error('Failed to fetch relief teachers', err);
            }
        };

        if (showModal) {
            fetchReliefTeachers();
        }
    }, [formData.start_date, formData.end_date, showModal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.post('/teacher/leave', formData);
            showToast('Leave applied successfully! Relief teacher will be notified.', 'success');
            setShowModal(false);
            fetchData(); // Refresh balances and history
            setFormData({
                leave_type_id: 0,
                start_date: '',
                end_date: '',
                is_half_day: false,
                reason: '',
                relief_teacher_id: 0
            });
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to submit application', 'error');
        }
    };

    // Cancellation Workflow
    const initiateCancelLeave = (leaveId: number) => {
        setSelectedLeaveId(leaveId);
        setShowCancelModal(true);
    };

    const confirmCancelLeave = async () => {
        if (!selectedLeaveId) return;
        try {
            await api.put(`/teacher/leave/${selectedLeaveId}/cancel`);
            showToast('Leave cancelled successfully.', 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to cancel leave', 'error');
        } finally {
            setShowCancelModal(false);
            setSelectedLeaveId(null);
        }
    };

    // Relief Response Workflow
    const handleReliefResponse = async (leaveId: number, status: 'Approved' | 'Rejected') => {
        if (status === 'Rejected') {
            setSelectedRequestId(leaveId);
            setShowRejectModal(true);
            return;
        }

        // Handle Approval immediately
        try {
            await api.put('/teacher/leave/relief-requests', { leaveId, status });
            showToast(`Relief request ${status} successfully.`, 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to update relief status', 'error');
        }
    };

    const confirmRejectRequest = async (reason: string) => {
        if (!selectedRequestId) return;
        try {
            await api.put('/teacher/leave/relief-requests', {
                leaveId: selectedRequestId,
                status: 'Rejected',
                reason
            });
            showToast('Relief request rejected successfully.', 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to reject request', 'error');
        } finally {
            setShowRejectModal(false);
            setSelectedRequestId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': case 'Approved': return 'bg-green-100 text-green-800';
            case 'rejected': case 'Rejected': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

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

                {/* Modals */}
                <ConfirmationModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={confirmCancelLeave}
                    title="Cancel Leave Application"
                    message="Are you sure you want to cancel this leave application? This action cannot be undone."
                    confirmText="Yes, Cancel Leave"
                    cancelText="No, Keep It"
                    type="danger"
                />

                <RejectionModal
                    isOpen={showRejectModal}
                    onClose={() => setShowRejectModal(false)}
                    onConfirm={confirmRejectRequest} // Now accepts (reason: string)
                    title="Reject Relief Request"
                />

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Leaves</h1>
                        <p className="text-gray-600 mt-1">Manage your leave applications and relief requests</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <span>+</span>
                        <span>Apply for Leave</span>
                    </button>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {balances.map((balance) => (
                        <div key={balance.type_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-semibold text-gray-700">{balance.name}</h3>
                            <div className="mt-4 flex justify-between items-end">
                                <div>
                                    <span className="text-sm text-gray-500 block mb-1">Allocated</span>
                                    <div className="text-2xl font-bold text-gray-800">{balance.quota}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-gray-500 block mb-1">Remaining</span>
                                    <div className={`text-2xl font-bold ${balance.remaining === 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        {balance.remaining}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200 mb-0">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('my-leaves')}
                            className={`${activeTab === 'my-leaves'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            My Leave Applications
                        </button>
                        <button
                            onClick={() => setActiveTab('relief-requests')}
                            className={`${activeTab === 'relief-requests'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                        >
                            Relief Requests
                            {reliefRequests.length > 0 && (
                                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                                    {reliefRequests.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="bg-white rounded-b-lg shadow-sm overflow-hidden mb-8">
                    {activeTab === 'my-leaves' ? (
                        <>
                            {/* History Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relief</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading ? (
                                            <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={5}>Loading...</td></tr>
                                        ) : history.length === 0 ? (
                                            <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={5}>No leave history found.</td></tr>
                                        ) : (
                                            history.map((leave) => (
                                                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.leave_type_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                                        {leave.is_half_day && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">Half Day</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="font-medium text-gray-900">{leave.relief_teacher_name}</div>
                                                        <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${getStatusColor(leave.relief_status || 'Pending')}`}>
                                                            Relief: {leave.relief_status || 'Pending'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                                                            {leave.status}
                                                        </span>
                                                        {leave.rejection_reason && <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={leave.rejection_reason}>{leave.rejection_reason}</div>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {(leave.status === 'pending' || leave.status === 'approved') && (
                                                            <button
                                                                onClick={() => initiateCancelLeave(leave.id)}
                                                                className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors font-medium border border-transparent hover:border-red-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        // RELIEF REQUESTS TAB
                        <div className="overflow-x-auto">
                            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                                <h3 className="text-sm font-medium text-yellow-800 flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    Requests requiring your acceptance as a relief teacher
                                </h3>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={4}>Loading...</td></tr>
                                    ) : reliefRequests.length === 0 ? (
                                        <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={4}>No pending relief requests.</td></tr>
                                    ) : (
                                        reliefRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{req.applicant_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                                    {req.is_half_day && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">Half Day</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                                                    <button
                                                        onClick={() => handleReliefResponse(req.id, 'Approved')}
                                                        className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 shadow-sm transition-colors text-xs font-medium uppercase tracking-wide"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReliefResponse(req.id, 'Rejected')}
                                                        className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 shadow-sm transition-colors text-xs font-medium uppercase tracking-wide"
                                                    >
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal (Reused) */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-xl font-bold text-gray-800">Apply for Leave</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            {/* Error Toast replaces inline error, but keeping form validation error if needed, or remove */}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={formData.leave_type_id}
                                        onChange={e => setFormData({ ...formData, leave_type_id: Number(e.target.value) })}
                                        required
                                    >
                                        <option value={0}>Select Type</option>
                                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={formData.start_date}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center space-x-2 text-gray-700 cursor-pointer p-2 hover:bg-gray-50 rounded select-none">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            checked={formData.is_half_day}
                                            onChange={e => setFormData({ ...formData, is_half_day: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium">Half Day / Short Leave</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        required
                                        placeholder="Briefly explain the reason for your leave..."
                                    />
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <label className="block text-sm font-medium text-red-800 mb-1">Relief Teacher (Mandatory)</label>
                                    <p className="text-xs text-red-600 mb-2">You must assign a relief teacher to cover your duties.</p>
                                    <select
                                        className="w-full border border-red-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        value={formData.relief_teacher_id}
                                        onChange={e => setFormData({ ...formData, relief_teacher_id: Number(e.target.value) })}
                                        required
                                        disabled={!formData.start_date || !formData.end_date}
                                    >
                                        <option value={0}>
                                            {!formData.start_date || !formData.end_date
                                                ? 'Select Dates First'
                                                : teachers.length === 0
                                                    ? 'No Available Teachers (Same Subject)'
                                                    : 'Select Covering Teacher'}
                                        </option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                                    >
                                        Submit Application
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

export default LeaveManagement;
