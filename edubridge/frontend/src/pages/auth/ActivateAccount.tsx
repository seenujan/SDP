import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { CheckCircle, AlertCircle, ShieldCheck, GraduationCap, Eye, EyeOff } from 'lucide-react';
import loginIllustration from '../../assets/images/login-illustration-new.png';

const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);

    const isLengthValid = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isPasswordValid = isLengthValid && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    const isConfirmValid = confirmPassword.length > 0 && password === confirmPassword;
    const isFormValid = isPasswordValid && isConfirmValid;

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing activation token.');
            setVerifying(false);
            return;
        }

        // Verify token and get email
        authAPI.verifyToken(token)
            .then(res => {
                setEmail(res.data.email);
            })
            .catch((err: any) => {
                setError('Invalid or expired activation link.');
                console.error(err);
            })
            .finally(() => {
                setVerifying(false);
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isFormValid) {
            setError('Please ensure your password meets all requirements and matches.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.activate(token!, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Activation failed.');
            setSuccess(false);
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

                    {verifying ? (
                        <div className="text-center py-12">
                            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-gray-600 font-bold text-lg">Verifying your link...</p>
                            <p className="text-gray-500 text-sm mt-2">Please wait while we check your activation code.</p>
                        </div>
                    ) : success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 drop-shadow-sm">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Account Activated!</h2>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                                Your account has been successfully activated. You can now log in to the EduBridge platform.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-700/40 transform transition-all duration-200 active:scale-[0.98]"
                            >
                                Go to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Activate Account</h1>
                                <p className="text-gray-500">Set up your password to activate your account.</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded-r-lg flex items-start" role="alert">
                                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {!token ? (
                                <div className="text-center bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <p className="text-gray-600 mb-4 font-semibold text-sm">Activation link is invalid or expired.</p>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center w-full bg-white text-gray-800 font-bold py-3.5 px-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                                    >
                                        Return to Login
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 mb-6">
                                        <h3 className="text-sm font-bold text-blue-800 flex items-center mb-3">
                                            <ShieldCheck size={18} className="mr-2" />
                                            Password Requirements
                                        </h3>
                                        <ul className="space-y-2.5">
                                            <li className={`flex items-center text-xs font-semibold ${isLengthValid ? 'text-green-600' : 'text-blue-700'}`}>
                                                {isLengthValid ? <CheckCircle size={14} className="mr-2" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 mr-2.5"></div>}
                                                8+ characters
                                            </li>
                                            <li className={`flex items-center text-xs font-semibold ${hasUpperCase && hasLowerCase ? 'text-green-600' : 'text-blue-700'}`}>
                                                {hasUpperCase && hasLowerCase ? <CheckCircle size={14} className="mr-2" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 mr-2.5"></div>}
                                                Uppercase & lowercase letters
                                            </li>
                                            <li className={`flex items-center text-xs font-semibold ${hasNumbers ? 'text-green-600' : 'text-blue-700'}`}>
                                                {hasNumbers ? <CheckCircle size={14} className="mr-2" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 mr-2.5"></div>}
                                                At least 1 number
                                            </li>
                                            <li className={`flex items-center text-xs font-semibold ${hasSpecialChar ? 'text-green-600' : 'text-blue-700'}`}>
                                                {hasSpecialChar ? <CheckCircle size={14} className="mr-2" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 mr-2.5"></div>}
                                                At least 1 special character (!@#$)
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full bg-gray-100 text-gray-500 font-medium text-sm border-2 border-gray-100 rounded-xl px-4 py-3.5 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`w-full bg-gray-50 text-gray-800 text-sm border-2 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-4 transition-all placeholder-gray-400 pr-12 ${
                                                    password.length > 0
                                                        ? (isPasswordValid
                                                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10 bg-green-50/30'
                                                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30')
                                                        : 'border-gray-100 focus:border-blue-500 focus:ring-blue-500/10'
                                                }`}
                                                placeholder="Enter new password"
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

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className={`w-full bg-gray-50 text-gray-800 text-sm border-2 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-4 transition-all placeholder-gray-400 pr-12 ${
                                                    confirmPassword.length > 0
                                                      ? (password === confirmPassword && isConfirmValid
                                                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10 bg-green-50/30'
                                                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30')
                                                      : 'border-gray-100 focus:border-blue-500 focus:ring-blue-500/10'
                                                }`}
                                                placeholder="Confirm new password"
                                                required
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
                                        disabled={loading || !isFormValid}
                                        className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-700/40 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-none flex justify-center items-center"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Activating...
                                            </span>
                                        ) : 'Activate Account'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
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
                            alt="Students Learning"
                            className="relative w-full h-auto object-contain animate-fade-in-up drop-shadow-xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivateAccount;
