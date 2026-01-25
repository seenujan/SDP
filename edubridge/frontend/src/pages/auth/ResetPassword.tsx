import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { GraduationCap, ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import loginIllustration from '../../assets/images/login-illustration-new.jpg';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Removed unused message state
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!token) {
            setError('Missing reset token');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password. Token may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex bg-white font-sans text-gray-900 justify-center items-center">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Complete!</h2>
                    <p className="text-gray-500 mb-6">Your password has been successfully updated. You can now log in with your new password.</p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white font-sans text-gray-900">
            {/* Left Side - Form Section */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-20 relative z-20 bg-white">
                <div className="max-w-md w-full mx-auto">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                            <GraduationCap className="text-white" size={28} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-gray-800 uppercase tracking-wide">EduBridge</span>
                            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">School Management</span>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Set New Password</h1>
                        <p className="text-gray-500">Please enter your new password below.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded-r-lg" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 text-gray-800 text-sm border-2 border-gray-100 rounded-xl pl-10 pr-12 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-400"
                                    placeholder="Enter new password"
                                    required
                                    disabled={!token}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-50 text-gray-800 text-sm border-2 border-gray-100 rounded-xl pl-10 pr-12 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-400"
                                    placeholder="Confirm new password"
                                    required
                                    disabled={!token}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-700/40 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting...
                                </span>
                            ) : 'Reset Password'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/login" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Illustration Section */}
            <div className="hidden lg:block w-[55%] relative overflow-hidden bg-blue-50">
                {/* Same illustration background as Login */}
                <div className="absolute top-0 bottom-0 left-[-1px] z-10 text-white w-24 h-full pointer-events-none">
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="h-full w-full fill-current"
                    >
                        <path d="M0 0 C 70 0 100 50 0 100 Z" />
                    </svg>
                </div>

                <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-50px] left-[100px] w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl"></div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-0">
                    <div className="w-full max-w-lg mb-8 relative">
                        <div className="absolute inset-0 bg-blue-100/50 rounded-full filter blur-xl scale-90 translate-y-4"></div>
                        <img
                            src={loginIllustration}
                            alt="Illustration"
                            className="relative w-full h-auto object-contain animate-fade-in-up drop-shadow-xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
