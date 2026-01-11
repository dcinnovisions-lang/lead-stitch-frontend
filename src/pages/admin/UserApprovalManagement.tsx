import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    approved_at?: string;
    rejection_reason?: string;
    approvedByUser?: {
        email: string;
        first_name: string;
        last_name: string;
    };
}

interface Stats {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
}

const UserApprovalManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [page, setPage] = useState(1);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<Toast | null>(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [filter, page]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/user-approval', {
                params: { status: filter, page, limit: 20 },
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(response.data.data);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/user-approval/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/user-approval/${userId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast('User approved successfully!', 'success');
            setShowApproveConfirm(false);
            setConfirmUserId(null);
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to approve user', 'error');
        }
    };

    const handleReject = async () => {
        if (!selectedUserId || !rejectionReason.trim()) {
            showToast('Please provide a rejection reason', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Send both fields for maximum compatibility
            await axios.post(`/api/user-approval/${selectedUserId}/reject`, 
                { reason: rejectionReason, rejection_reason: rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showToast('User rejected successfully', 'success');
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedUserId(null);
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to reject user', 'error');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedUsers.size === 0) {
            showToast('Please select users to approve', 'info');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/user-approval/bulk/approve',
                { userIds: Array.from(selectedUsers) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showToast(`${selectedUsers.size} users approved successfully!`, 'success');
            setSelectedUsers(new Set());
            fetchUsers();
            fetchStats();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to approve users', 'error');
        }
    };

    const toggleUserSelection = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const filteredUsers = Array.isArray(users) ? users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Toast Notification */}
                {toast && (
                    <div className="fixed top-4 right-4 z-50 animate-slide-in">
                        <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
                            toast.type === 'success' ? 'bg-green-500 text-white' :
                            toast.type === 'error' ? 'bg-red-500 text-white' :
                            'bg-blue-500 text-white'
                        }`}>
                            {toast.type === 'success' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {toast.type === 'error' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            <span className="font-medium">{toast.message}</span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">User Approval Management</h1>
                                <p className="text-gray-500 mt-1">Review and manage user registration requests</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { fetchUsers(); fetchStats(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-yellow-700">Pending Approval</p>
                            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-yellow-800">{stats.pending}</p>
                        <p className="text-xs text-yellow-600 mt-2">Waiting for review</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-green-700">Approved</p>
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-green-800">{stats.approved}</p>
                        <p className="text-xs text-green-600 mt-2">Active users</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-red-700">Rejected</p>
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-red-800">{stats.rejected}</p>
                        <p className="text-xs text-red-600 mt-2">Denied access</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-blue-700">Total Users</p>
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-blue-800">{stats.total}</p>
                        <p className="text-xs text-blue-600 mt-2">All registrations</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Filter Tabs */}
                        <div className="flex gap-2 flex-wrap">
                            {(['pending', 'approved', 'rejected', 'all'] as const).map(f => {
                                const counts = { pending: stats.pending, approved: stats.approved, rejected: stats.rejected, all: stats.total };
                                return (
                                    <button
                                        key={f}
                                        onClick={() => {
                                            setFilter(f);
                                            setPage(1);
                                            setSelectedUsers(new Set());
                                        }}
                                        className={`px-5 py-2.5 rounded-lg font-medium transition-all capitalize flex items-center gap-2 ${
                                            filter === f
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md scale-105'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {f}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            filter === f ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {counts[f]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full lg:w-80">
                            <input
                                type="text"
                                placeholder="Search by email or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedUsers.size > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-blue-800 font-medium">{selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected</span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedUsers(new Set())}
                                    className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    Clear Selection
                                </button>
                                <button
                                    onClick={handleBulkApprove}
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Approve Selected
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-800">User List</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                            <p className="text-gray-600 font-medium">Loading users...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredUsers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No users found</h3>
                            <p className="text-gray-500 text-center max-w-md">
                                {searchQuery 
                                    ? `No users match "${searchQuery}". Try a different search term.`
                                    : filter === 'pending'
                                    ? 'All users have been reviewed! No pending approvals at the moment.'
                                    : `No ${filter} users found.`
                                }
                            </p>
                        </div>
                    )}

                    {/* Table Content */}
                    {!loading && filteredUsers.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                                                    } else {
                                                        setSelectedUsers(new Set());
                                                    }
                                                }}
                                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Registered</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                                                        {getInitials(user.first_name, user.last_name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {user.first_name} {user.last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                                    user.approval_status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                        : user.approval_status === 'approved'
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        user.approval_status === 'pending' ? 'bg-yellow-500' :
                                                        user.approval_status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                    {user.approval_status.charAt(0).toUpperCase() + user.approval_status.slice(1)}
                                                </span>
                                                {user.rejection_reason && (
                                                    <p className="text-xs text-red-600 mt-1 italic">"{user.rejection_reason}"</p>
                                                )}
                                                {user.approvedByUser && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        by {user.approvedByUser.first_name} {user.approvedByUser.last_name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(user.created_at).toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        year: 'numeric' 
                                                    })}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(user.created_at).toLocaleTimeString('en-US', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {/* Pending Users - Show Approve & Reject */}
                                                {user.approval_status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setConfirmUserId(user.id);
                                                                setShowApproveConfirm(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserId(user.id);
                                                                setShowRejectModal(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {/* Approved Users - Show Revoke/Reject */}
                                                {user.approval_status === 'approved' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserId(user.id);
                                                                setShowRejectModal(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-md"
                                                            title="Revoke access and reject user"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                            </svg>
                                                            Revoke
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {/* Rejected Users - Show Re-approve */}
                                                {user.approval_status === 'rejected' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setConfirmUserId(user.id);
                                                                setShowApproveConfirm(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-md"
                                                            title="Re-approve this user"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Re-approve
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Approve Confirmation Modal */}
                {showApproveConfirm && (() => {
                    const currentUser = filteredUsers.find(u => u.id === confirmUserId);
                    const isReApproval = currentUser?.approval_status === 'rejected';
                    return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform animate-scale-in">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 ${isReApproval ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                                    <svg className={`w-8 h-8 ${isReApproval ? 'text-blue-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isReApproval ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M5 13l4 4L19 7"} />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{isReApproval ? 'Re-approve User' : 'Approve User'}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{isReApproval ? 'Restore user access' : 'Grant access to the platform'}</p>
                                </div>
                            </div>
                            
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                {isReApproval 
                                    ? 'This user was previously rejected. Are you sure you want to re-approve them? They will regain immediate access to all platform features.'
                                    : 'Are you sure you want to approve this user? They will gain immediate access to all platform features.'
                                }
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowApproveConfirm(false);
                                        setConfirmUserId(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => confirmUserId && handleApprove(confirmUserId)}
                                    className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${isReApproval ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg`}
                                >
                                    {isReApproval ? 'Confirm Re-approval' : 'Confirm Approval'}
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })()}

                {/* Rejection Modal */}
                {showRejectModal && (() => {
                    const currentUser = filteredUsers.find(u => u.id === selectedUserId);
                    const isRevoke = currentUser?.approval_status === 'approved';
                    return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform animate-scale-in">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 ${isRevoke ? 'bg-orange-100' : 'bg-red-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                                    <svg className={`w-8 h-8 ${isRevoke ? 'text-orange-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRevoke ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M6 18L18 6M6 6l12 12"} />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{isRevoke ? 'Revoke Access' : 'Reject User'}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{isRevoke ? 'Remove user access' : 'Deny access to the platform'}</p>
                                </div>
                            </div>
                            
                            <label className="block mb-6">
                                <span className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for {isRevoke ? 'revocation' : 'rejection'} <span className="text-red-500">*</span>
                                </span>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                    rows={4}
                                    placeholder={isRevoke 
                                        ? "Explain why you're revoking access. This will be visible to the user."
                                        : "Provide a clear explanation for the rejection. This message will be visible to the user."
                                    }
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    {isRevoke 
                                        ? 'Be professional and clear. The user will lose access immediately and see this message.'
                                        : 'Be professional and specific. The user will see this message.'
                                    }
                                </p>
                            </label>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason('');
                                        setSelectedUserId(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim()}
                                    className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${isRevoke ? 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' : 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'} text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isRevoke ? 'Revoke Access' : 'Reject User'}
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })()}
            </div>
        </div>
        </AdminLayout>
    );
};

export default UserApprovalManagement;
