import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import ConfirmationModal from '../../components/common/ConfirmationModal';

import { adminAPI } from '../../services/api';
import { Plus, X, Edit2, Ban, CheckCircle } from 'lucide-react';

interface User {
    id: number;
    user_id?: number;
    email: string;
    role: string;
    full_name?: string;
    created_at: string;
    subject?: string;
    grade?: string;
    section?: string;
    phone?: string;
    parent_id?: number;
    parent_name?: string;
    active?: number;
}

interface ParentOption {
    id: number;
    full_name: string;
    email: string;
}

interface ClassOption {
    id: number;
    grade: string;
    section: string;
    class_teacher_name?: string;
}

interface Subject {
    id: number;
    subject_name: string;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [parents, setParents] = useState<User[]>([]);
    const [parentsDropdown, setParentsDropdown] = useState<ParentOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToToggle, setUserToToggle] = useState<User | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'student',
        fullName: '',
        additionalData: {
            grade: '',
            section: '',
            dateOfBirth: '',
            parentId: '',
            subjectId: '',
            phone: ''
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, studentsRes, teachersRes, parentsRes, parentsDropdownRes, classesRes, subjectsRes] = await Promise.all([
                adminAPI.getAllUsers(),
                adminAPI.getStudents(),
                adminAPI.getTeachers(),
                adminAPI.getParents(),
                adminAPI.getParentsDropdown(),
                adminAPI.getClasses(),
                adminAPI.getSubjects(),
            ]);
            setUsers(usersRes.data);
            setStudents(studentsRes.data);
            setTeachers(teachersRes.data);
            setParents(parentsRes.data);
            setParentsDropdown(parentsDropdownRes.data);
            setClasses(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            role: 'student',
            fullName: '',
            additionalData: { grade: '', section: '', dateOfBirth: '', parentId: '', subjectId: '', phone: '' }
        });
        setError('');
    };

    // Create User
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (formData.role === 'parent') {
                await adminAPI.createParent({
                    email: formData.email,
                    fullName: formData.fullName,
                    phone: formData.additionalData.phone
                });
            } else if (formData.role === 'student') {
                await adminAPI.createStudent({
                    email: formData.email,
                    fullName: formData.fullName,
                    grade: formData.additionalData.grade,
                    section: formData.additionalData.section,
                    dateOfBirth: formData.additionalData.dateOfBirth,
                    parentId: formData.additionalData.parentId
                });
            } else if (formData.role === 'teacher') {
                await adminAPI.createTeacher({
                    email: formData.email,
                    fullName: formData.fullName,
                    subjectId: formData.additionalData.subjectId
                });
            } else {
                // Admin or fallback
                await adminAPI.createUser(formData);
            }

            setShowAddModal(false);
            resetForm();
            alert(`User created successfully! An activation email has been sent to ${formData.email}.`);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit User - Open modal with user data
    const openEditModal = async (userId: number) => {
        try {
            const response = await adminAPI.getUserById(userId);
            const user = response.data;
            setSelectedUser(user);
            setFormData({
                email: user.email || '',
                password: '',
                role: user.role || 'student',
                fullName: user.full_name || '',
                additionalData: {
                    grade: user.grade || '',
                    section: user.section || '',
                    dateOfBirth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
                    parentId: user.parent_id?.toString() || '',
                    subjectId: user.subject ? subjects.find(s => s.subject_name === user.subject)?.id.toString() || '' : '',
                    phone: user.phone || ''
                }
            });
            setShowEditModal(true);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    // Update User
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setSubmitting(true);
        setError('');
        try {
            await adminAPI.updateUser(selectedUser.id, formData);
            setShowEditModal(false);
            resetForm();
            setSelectedUser(null);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle Status Click Handler
    const onToggleStatusClick = (user: User) => {
        setUserToToggle(user);
        setShowConfirmModal(true);
    };

    // Actual Toggle Implementation
    const handleToggleStatus = async (user: User) => {
        try {
            // Optimistic update
            const newStatus = user.active === 1 ? 0 : 1;
            setUsers(users.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
            setStudents(students.map(u => u.user_id === user.id ? { ...u, active: newStatus } : u));
            setTeachers(teachers.map(u => u.user_id === user.id ? { ...u, active: newStatus } : u));
            setParents(parents.map(u => u.user_id === user.id ? { ...u, active: newStatus } : u));

            await adminAPI.toggleUserStatus(user.id || user.user_id!);
            // Refresh data to be sure
            fetchData();
        } catch (err: any) {
            console.error('Failed to toggle status:', err);
            alert('Failed to update user status');
            fetchData(); // Revert on error
        }
    };

    // Table columns for All Users
    const allUsersColumns = [
        { key: 'id', header: 'ID' },
        { key: 'full_name', header: 'Name', render: (val: string) => val || 'Admin' },
        { key: 'email', header: 'Email' },
        {
            key: 'role',
            header: 'Role',
            render: (val: string) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
          ${val === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
          ${val === 'teacher' ? 'bg-blue-100 text-blue-800' : ''}
          ${val === 'student' ? 'bg-green-100 text-green-800' : ''}
          ${val === 'parent' ? 'bg-orange-100 text-orange-800' : ''}
        `}>
                    {val}
                </span>
            )
        },
        {
            key: 'active',
            header: 'Status',
            render: (val: number) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {val === 1 ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'created_at',
            header: 'Created',
            render: (val: string) => new Date(val).toLocaleDateString()
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: any, row: User) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => openEditModal(row.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onToggleStatusClick(row)}
                        className={`p-1 rounded ${row.active === 1 ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={row.active === 1 ? "Deactivate User" : "Activate User"}
                    >
                        {row.active === 1 ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                </div>
            ),
        },
    ];

    const studentColumns = [
        { key: 'user_id', header: 'ID' },
        { key: 'full_name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'grade', header: 'Grade' },
        { key: 'section', header: 'Section', render: (val: string) => val || '-' },
        { key: 'parent_name', header: 'Parent', render: (val: string) => val || 'Not Assigned' },
        {
            key: 'active',
            header: 'Status',
            render: (val: number) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {val === 1 ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: any, row: User) => (
                <div className="flex space-x-2">
                    <button onClick={() => openEditModal(row.user_id!)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                    <button
                        onClick={() => onToggleStatusClick({ ...row, id: row.user_id! })}
                        className={`p-1 rounded ${row.active === 1 ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={row.active === 1 ? "Deactivate" : "Activate"}
                    >
                        {row.active === 1 ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                </div>
            ),
        },
    ];

    const teacherColumns = [
        { key: 'user_id', header: 'ID' },
        { key: 'full_name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'subject', header: 'Subject', render: (val: string) => val || 'Not Assigned' },
        {
            key: 'active',
            header: 'Status',
            render: (val: number) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {val === 1 ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: any, row: User) => (
                <div className="flex space-x-2">
                    <button onClick={() => openEditModal(row.user_id!)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                    <button
                        onClick={() => onToggleStatusClick({ ...row, id: row.user_id! })}
                        className={`p-1 rounded ${row.active === 1 ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={row.active === 1 ? "Deactivate" : "Activate"}
                    >
                        {row.active === 1 ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                </div>
            ),
        },
    ];

    const parentColumns = [
        { key: 'user_id', header: 'ID' },
        { key: 'full_name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone', render: (val: string) => val || 'N/A' },
        {
            key: 'active',
            header: 'Status',
            render: (val: number) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {val === 1 ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: any, row: User) => (
                <div className="flex space-x-2">
                    <button onClick={() => openEditModal(row.user_id!)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                    <button
                        onClick={() => onToggleStatusClick({ ...row, id: row.user_id! })}
                        className={`p-1 rounded ${row.active === 1 ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={row.active === 1 ? "Deactivate" : "Activate"}
                    >
                        {row.active === 1 ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                </div>
            ),
        },
    ];

    const getTableData = () => {
        switch (activeTab) {
            case 'students': return { columns: studentColumns, data: students };
            case 'teachers': return { columns: teacherColumns, data: teachers };
            case 'parents': return { columns: parentColumns, data: parents };
            default: return { columns: allUsersColumns, data: users };
        }
    };

    const { columns, data } = getTableData();

    // Form Fields Component
    const renderFormFields = (isEdit: boolean = false) => (
        <>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                />
            </div>
            {/* Password field removed for invite flow */}

            {!isEdit && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="parent">Parent</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            )}

            {/* Student Fields */}
            {(formData.role === 'student' || (isEdit && selectedUser?.role === 'student')) && (
                <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                            <select
                                value={formData.additionalData.grade}
                                onChange={(e) => setFormData({
                                    ...formData, additionalData: { ...formData.additionalData, grade: e.target.value, section: '' }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Grade</option>
                                {/* Get unique grades from classes */}
                                {[...new Set(classes.map(c => c.grade))].map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                            <select
                                value={formData.additionalData.section}
                                onChange={(e) => setFormData({
                                    ...formData, additionalData: { ...formData.additionalData, section: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                disabled={!formData.additionalData.grade}
                            >
                                <option value="">Select Section</option>
                                {/* Filter sections based on selected grade */}
                                {classes
                                    .filter(c => c.grade === formData.additionalData.grade)
                                    .map((c) => (
                                        <option key={c.id} value={c.section}>{c.section}</option>
                                    ))}
                            </select>
                        </div>
                    </div>
                    {classes.length === 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                            ⚠️ No classes found. Please create classes first before adding students.
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.additionalData.dateOfBirth}
                            onChange={(e) => setFormData({
                                ...formData, additionalData: { ...formData.additionalData, dateOfBirth: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                        <select
                            value={formData.additionalData.parentId}
                            onChange={(e) => setFormData({
                                ...formData, additionalData: { ...formData.additionalData, parentId: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Select Parent</option>
                            {parentsDropdown.map((parent) => (
                                <option key={parent.id} value={parent.id}>
                                    {parent.full_name} ({parent.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* Teacher Fields */}
            {(formData.role === 'teacher' || (isEdit && selectedUser?.role === 'teacher')) && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <select
                        value={formData.additionalData.subjectId}
                        onChange={(e) => setFormData({
                            ...formData, additionalData: { ...formData.additionalData, subjectId: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.subject_name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Parent Fields */}
            {(formData.role === 'parent' || (isEdit && selectedUser?.role === 'parent')) && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                        type="tel"
                        value={formData.additionalData.phone}
                        onChange={(e) => setFormData({
                            ...formData, additionalData: { ...formData.additionalData, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., +94 77 123 4567"
                    />
                </div>
            )}
        </>
    );

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-600 mt-1">Manage all system users</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        Invite User
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'all', label: 'All Users', count: users.length },
                            { id: 'students', label: 'Students', count: students.length },
                            { id: 'teachers', label: 'Teachers', count: teachers.length },
                            { id: 'parents', label: 'Parents', count: parents.length },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12"><p className="text-gray-500">Loading...</p></div>
                ) : (
                    <DataTable columns={columns} data={data} emptyMessage="No users found" />
                )}

                {/* Add User Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Invite New User</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                            </div>
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
                            <form onSubmit={handleCreate}>
                                {renderFormFields(false)}
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                        {submitting ? 'Sending Invite...' : 'Send Invitation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
                                <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                            </div>
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">Role: </span>
                                <span className="font-medium capitalize">{selectedUser.role}</span>
                            </div>
                            <form onSubmit={handleUpdate}>
                                {renderFormFields(true)}
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button type="button" onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                        {submitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => { setShowConfirmModal(false); setUserToToggle(null); }}
                    onConfirm={() => userToToggle && handleToggleStatus(userToToggle)}
                    title={userToToggle?.active === 1 ? "Deactivate User" : "Activate User"}
                    message={userToToggle?.active === 1
                        ? `Are you sure you want to deactivate ${userToToggle?.full_name || 'this user'}? They will not be able to log in until activated again.`
                        : `Are you sure you want to activate ${userToToggle?.full_name || 'this user'}? They will be able to log in and access the system.`
                    }
                    confirmText={userToToggle?.active === 1 ? "Deactivate" : "Activate"}
                    type={userToToggle?.active === 1 ? "danger" : "success"}
                />
            </div>
        </DashboardLayout>
    );
};

export default UserManagement;
