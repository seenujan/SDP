import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { profileAPI } from '../services/api';
import { User, Save } from 'lucide-react';

interface ProfileData {
    id: number;
    email: string;
    role: string;
    full_name: string;
    subject?: string;
    phone?: string;
    date_of_birth?: string;
    grade?: string;
    section?: string;
}

const Profile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile form data
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        dateOfBirth: '',
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileAPI.getProfile();
            setProfile(response.data);
            setProfileForm({
                fullName: response.data.full_name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
                subject: response.data.subject || '',
                dateOfBirth: response.data.date_of_birth ? response.data.date_of_birth.split('T')[0] : '',
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            showMessage('error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await profileAPI.updateProfile(profileForm);
            showMessage('success', 'Profile updated successfully');
            fetchProfile();
        } catch (error: any) {
            showMessage('error', error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
                    <p className="text-gray-600 mt-1">Manage your account information</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-6">
                        <User className="text-primary-600 mr-2" size={24} />
                        <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={profileForm.fullName}
                                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {profile?.role === 'teacher' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={profileForm.subject}
                                        onChange={(e) => setProfileForm({ ...profileForm, subject: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {profile?.role === 'parent' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {profile?.role === 'student' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={profileForm.dateOfBirth}
                                            onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                        <input
                                            type="text"
                                            value={`${profile.grade || ''} - ${profile.section || ''}`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            disabled
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input
                                    type="text"
                                    value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                    disabled
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            <Save size={18} className="mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
