import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { profileAPI } from '../services/api';
import { Lock, Save, Loader2, CheckCircle, XCircle, ShieldCheck, AlertCircle } from 'lucide-react';

const ChangePassword = () => {
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isLengthValid = passwordForm.newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordForm.newPassword);
    const hasNumbers = /\d/.test(passwordForm.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword);
    const isPasswordValid = isLengthValid && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    const isConfirmValid = passwordForm.confirmPassword.length > 0 && passwordForm.newPassword === passwordForm.confirmPassword;
    const isFormValid = isPasswordValid && isConfirmValid && passwordForm.currentPassword.length > 0;

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) {
            showMessage('error', 'Please ensure your password meets all requirements and matches.');
            return;
        }

        setSaving(true);
        try {
            await profileAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            showMessage('success', 'Password changed successfully');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            showMessage('error', error.response?.data?.error || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Change Password</h1>
                    <p className="text-gray-600 mt-1">Update your password to keep your account secure</p>
                </div>

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
                    {/* LEFT COLUMN: SECURITY INFO/HERO */}
                    <div className="xl:col-span-1">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col">
                            {/* Decorative blobs */}
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full pointer-events-none" />
                            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white opacity-10 rounded-full pointer-events-none" />
                            
                            <div className="relative z-10 flex-1 flex flex-col">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/10">
                                    <ShieldCheck size={32} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 tracking-tight">Password Security</h2>
                                <p className="text-primary-100 text-sm leading-relaxed mb-6">
                                    Keeping your account secure is our top priority. Please choose a strong, unique password.
                                </p>
                                
                                <div className="space-y-5 pt-6 border-t border-white/20 mt-auto">
                                    <div className={`flex items-center transition-colors ${isLengthValid ? 'text-green-400' : 'text-primary-50'}`}>
                                        {isLengthValid ? <CheckCircle size={20} className="mr-3 shrink-0" /> : <div className="w-5 h-5 border-2 border-white/30 rounded-full mr-3 shrink-0"></div>}
                                        <p className="text-sm font-medium leading-snug">8+ characters</p>
                                    </div>
                                    <div className={`flex items-center transition-colors ${hasUpperCase && hasLowerCase ? 'text-green-400' : 'text-primary-50'}`}>
                                        {hasUpperCase && hasLowerCase ? <CheckCircle size={20} className="mr-3 shrink-0" /> : <div className="w-5 h-5 border-2 border-white/30 rounded-full mr-3 shrink-0"></div>}
                                        <p className="text-sm font-medium leading-snug">Uppercase & lowercase letters</p>
                                    </div>
                                    <div className={`flex items-center transition-colors ${hasNumbers ? 'text-green-400' : 'text-primary-50'}`}>
                                        {hasNumbers ? <CheckCircle size={20} className="mr-3 shrink-0" /> : <div className="w-5 h-5 border-2 border-white/30 rounded-full mr-3 shrink-0"></div>}
                                        <p className="text-sm font-medium leading-snug">At least 1 number</p>
                                    </div>
                                    <div className={`flex items-center transition-colors ${hasSpecialChar ? 'text-green-400' : 'text-primary-50'}`}>
                                        {hasSpecialChar ? <CheckCircle size={20} className="mr-3 shrink-0" /> : <div className="w-5 h-5 border-2 border-white/30 rounded-full mr-3 shrink-0"></div>}
                                        <p className="text-sm font-medium leading-snug">At least 1 special character (!@#...)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FORM */}
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center mb-8">
                                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-primary-100">
                                    <Lock className="text-primary-600" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Update Password</h2>
                                    <p className="text-sm text-gray-500 font-medium">Enter your current and new password below</p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordChange}>
                                <div className="space-y-6 mb-8 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                            required
                                        />
                                    </div>
                                    <div className="pt-6 border-t border-gray-100 mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all hover:bg-white focus:bg-white ${
                                                passwordForm.newPassword.length > 0
                                                    ? (isPasswordValid
                                                        ? 'bg-white border-green-500 ring-2 ring-green-500/20'
                                                        : 'bg-white border-red-500 ring-2 ring-red-500/20')
                                                    : 'bg-gray-50 border-gray-200 focus:ring-primary-500'
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all hover:bg-white focus:bg-white ${
                                                passwordForm.confirmPassword.length > 0 
                                                  ? (passwordForm.newPassword === passwordForm.confirmPassword 
                                                        ? 'bg-white border-green-500 ring-2 ring-green-500/20' 
                                                        : 'bg-white border-red-500 ring-2 ring-red-500/20')
                                                  : 'bg-gray-50 border-gray-200 focus:ring-primary-500'
                                            }`}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end pt-6 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={saving || !isFormValid}
                                        className="flex items-center px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all font-semibold shadow-sm hover:shadow-md"
                                    >
                                        {saving ? (
                                            <Loader2 size={20} className="mr-2 animate-spin" />
                                        ) : (
                                            <Save size={20} className="mr-2" />
                                        )}
                                        {saving ? 'Updating...' : 'Update Password'}
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

export default ChangePassword;
