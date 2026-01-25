import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import loginIllustration from '../../assets/images/login-illustration-new.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);
            const { token, user } = response.data;

            login(token, user);

            // Redirect based on role
            const dashboardMap: Record<string, string> = {
                admin: '/admin/dashboard',
                teacher: '/teacher/dashboard',
                student: '/student/dashboard',
                parent: '/parent/dashboard',
            };

            navigate(dashboardMap[user.role]);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
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
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back!</h1>
                        <p className="text-gray-500">Please login to access your account.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded-r-lg" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Username or Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 text-gray-800 text-sm border-2 border-gray-100 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-400"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 text-gray-800 text-sm border-2 border-gray-100 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-400 pr-12"
                                    placeholder="Enter your password"
                                    required
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember_me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-500 cursor-pointer">
                                    Remember me
                                </label>
                            </div>
                            <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                Forgot password?
                            </a>
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
                                    Logging in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
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
                    <div className="w-full max-w-lg mb-8 relative">
                        {/* Blob behind image */}
                        <div className="absolute inset-0 bg-blue-100/50 rounded-full filter blur-xl scale-90 translate-y-4"></div>
                        <img
                            src={loginIllustration}
                            alt="Students Learning"
                            className="relative w-full h-auto object-contain animate-fade-in-up drop-shadow-xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
