import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Save, Camera, Loader2, CheckCircle, XCircle } from 'lucide-react';

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
    profile_photo?: string;
}

const Profile = () => {
    const { updateUser } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileForm, setProfileForm] = useState<{
        fullName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
    }>({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileAPI.getProfile();
            const data = response.data;
            setProfile(data);
            setProfileForm({
                fullName: data.full_name || '',
                email: data.email || '',
                phone: data.phone || '',
                dateOfBirth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
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

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Upload to server
        setUploadingPhoto(true);
        try {
            const fd = new FormData();
            fd.append('photo', file);
            const res = await profileAPI.uploadProfilePhoto(fd);
            // Sync the header avatar immediately via AuthContext
            if (res.data?.photoUrl) {
                updateUser({ profile_photo: res.data.photoUrl });
            }
            showMessage('success', 'Profile photo updated!');
            // Refresh profile to get updated photo URL
            await fetchProfile();
        } catch (error: any) {
            showMessage('error', error.response?.data?.error || 'Failed to upload photo');
            setPhotoPreview(null);
        } finally {
            setUploadingPhoto(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const getPhotoSrc = () => {
        if (photoPreview) return photoPreview;
        if (profile?.profile_photo) return `/${profile.profile_photo}`;
        return null;
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'teacher': return 'bg-blue-100 text-blue-700';
            case 'student': return 'bg-green-100 text-green-700';
            case 'parent': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                </div>
            </DashboardLayout>
        );
    }

    const photoSrc = getPhotoSrc();

    return (
        <DashboardLayout>
            <div className="animate-fade-in max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                    <p className="text-gray-600 mt-1">Manage your account information and profile photo</p>
                </div>

                {/* Toast message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.type === 'success'
                            ? <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                            : <XCircle size={20} className="text-red-600 flex-shrink-0" />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    {/* LEFT COLUMN: HERO AVATAR */}
                    <div className="xl:col-span-1">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative pb-8">
                            <div className="h-32 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full" />
                                <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white opacity-10 rounded-full" />
                            </div>
                            
                            <div className="px-8 relative text-center">
                                {/* Avatar */}
                                <div className="relative group inline-block -mt-16 mb-4">
                                    <div
                                        onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                                        className={`w-32 h-32 mx-auto rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 bg-gray-50 ${
                                            uploadingPhoto ? 'opacity-70 cursor-not-allowed' : 'hover:ring-4 hover:ring-primary-100 hover:border-gray-50'
                                        }`}
                                        title="Click to change profile photo"
                                    >
                                        {photoSrc ? (
                                            <img
                                                src={photoSrc}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User size={56} className="text-gray-300" />
                                        )}
                                        
                                        {!uploadingPhoto && (
                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                                                <Camera size={22} className="text-white mb-1" />
                                                <span className="text-white text-xs font-medium">Change</span>
                                            </div>
                                        )}

                                        {uploadingPhoto && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                                                <Loader2 size={24} className="text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="absolute bottom-1 right-1 bg-primary-600 text-white rounded-full p-2 shadow-lg hover:bg-primary-700 transition-colors disabled:opacity-50 border-2 border-white"
                                        title="Upload photo"
                                    >
                                        <Camera size={14} />
                                    </button>
                                </div>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                    id="profile-photo-input"
                                />

                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{profile?.full_name}</h2>
                                <p className="text-gray-500 font-medium mt-0.5">{profile?.email}</p>
                                <div className="mt-4">
                                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${getRoleColor(profile?.role || '')}`}>
                                        {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                                    </span>
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-400 font-medium">
                                    Click your photo to upload a new one.<br />JPEG, PNG, WebP (max 5MB).
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: INFORMATION FORM */}
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center mb-8">
                                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-primary-100">
                                    <User className="text-primary-600" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                                    <p className="text-sm text-gray-500 font-medium">Update your details</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileForm.fullName}
                                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                            required
                                        />
                                    </div>

                                    {(profile?.role === 'parent' || profile?.role === 'teacher') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={profileForm.phone}
                                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    )}

                                    {profile?.role === 'teacher' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                                            <input
                                                type="text"
                                                value={profile?.subject || 'Not Assigned'}
                                                className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                                                disabled
                                            />
                                        </div>
                                    )}

                                    {profile?.role === 'student' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={profileForm.dateOfBirth}
                                                    onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                                                <input
                                                    type="text"
                                                    value={`${profile.grade || ''} - ${profile.section || ''}`}
                                                    className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    disabled
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                        <input
                                            type="text"
                                            value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                                            className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all font-semibold shadow-sm hover:shadow-md"
                                    >
                                        {saving ? (
                                            <Loader2 size={20} className="mr-2 animate-spin" />
                                        ) : (
                                            <Save size={20} className="mr-2" />
                                        )}
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
