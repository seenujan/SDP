import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { GraduationCap, ArrowLeft, Mail } from 'lucide-react';
import loginIllustration from '../../assets/images/login-illustration-new.png';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await authAPI.requestPasswordReset(email);
            setMessage('If an account exists with this email, you will receive password reset instructions shortly.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password?</h1>
                        <p className="text-gray-500">Enter your email address to receive reset instructions.</p>
                    </div>

                    {message && (
                        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 text-sm rounded-r-lg" role="alert">
                            <p>{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded-r-lg" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 text-gray-800 text-sm border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-400"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-700/40 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </span>
                            ) : 'Send Reset Link'}
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
                {/* Curved Separator */}
                <div className="absolute top-0 bottom-0 left-[-1px] z-10 text-white w-24 h-full pointer-events-none">
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="h-full w-full fill-current"
                    >
                        <path d="M0 0 C 70 0 100 50 0 100 Z" />
                    </svg>
                </div>

                {/* Background Decor */}
                <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-50px] left-[100px] w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl"></div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-0">
                    <div className="w-full max-w-2xl mb-8 relative">
                        {/* Blob behind image */}
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

export default ForgotPassword;
