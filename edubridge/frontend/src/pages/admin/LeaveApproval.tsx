
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TeacherLeave } from '../../types/leave';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search } from 'lucide-react';

const LeaveApproval: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [pendingLeaves, setPendingLeaves] = useState<TeacherLeave[]>([]);
    const [historyLeaves, setHistoryLeaves] = useState<TeacherLeave[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');

    // Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        // Reset filters when tab changes
        setSearchTerm('');
        setStatusFilter('all');
        if (activeTab === 'pending') fetchPending();
        else fetchHistory();
    }, [activeTab]);

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
            setRejectionReason('');
            setShowRejectModal(true);
            return;
        }

        if (status === 'approved') {
            if (!window.confirm('Approving this will automatically CANCEL any conflicting PTM meetings. Proceed?')) {
                return;
            }
            await submitStatusUpdate(leaveId, 'approved', null);
        }
    };

    const submitStatusUpdate = async (leaveId: number, status: 'approved' | 'rejected', reason: string | null) => {
        try {
            await api.put('/admin/leave/status', {
                leaveId,
                status,
                rejectionReason: reason
            });
            alert(`Leave ${status} successfully`);
            setShowRejectModal(false);
            fetchPending(); // Refresh pending list if we were there
            if (activeTab === 'history') fetchHistory();
        } catch (err) {
            alert('Failed to update status');
            console.error(err);
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

    if (loading && pendingLeaves.length === 0 && historyLeaves.length === 0) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Leave Management</h1>

                    {/* Filters Section */}
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search teacher or class..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>

                        {activeTab === 'history' && (
                            <select
                                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                <div className="flex space-x-4 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`py-2 px-4 font-medium ${activeTab === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pending Approvals
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-2 px-4 font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Leave History
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
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
                            {filteredLeaves.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No records found</td>
                                </tr>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <tr key={leave.id}>
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
                                            {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                                            {leave.is_half_day && <span className="ml-2 text-xs text-orange-600 font-bold">(Half Day)</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{leave.reason}</td>
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
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">Reject Leave Request</h3>
                        <textarea
                            className="w-full border rounded p-2 mb-4"
                            rows={3}
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => selectedLeaveId && submitStatusUpdate(selectedLeaveId, 'rejected', rejectionReason)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default LeaveApproval;
