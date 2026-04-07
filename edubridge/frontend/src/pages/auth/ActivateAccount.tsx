import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { CheckCircle, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">Verifying link...</div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activated!</h2>
                    <p className="text-gray-600 mb-6">
                        Your account has been successfully activated. You will be redirected to the login page shortly.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                        <Lock className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Activate Account</h2>
                    <p className="text-gray-600 mt-2">Set up your password to activate your account</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {!token ? (
                    <div className="text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                            <h3 className="text-sm font-semibold text-blue-800 flex items-center">
                                <ShieldCheck size={16} className="mr-2" />
                                Password Requirements
                            </h3>
                            <ul className="space-y-2 mt-3">
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-colors ${
                                    password.length > 0
                                        ? (isPasswordValid
                                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20')
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                                }`}
                                placeholder="Enter new password"
                                required
                            />
                            {password.length > 0 && !isPasswordValid && (
                                <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
                                    <AlertCircle size={14} className="mr-1" /> Password does not meet all requirements
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-colors ${
                                    confirmPassword.length > 0 
                                      ? (password === confirmPassword 
                                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' 
                                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20')
                                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                                }`}
                                placeholder="Confirm new password"
                                required
                            />
                            {confirmPassword.length > 0 && password !== confirmPassword && (
                                <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
                                    <AlertCircle size={14} className="mr-1" /> Passwords do not match
                                </p>
                            )}
                            {confirmPassword.length > 0 && password === confirmPassword && (
                                <p className="text-green-600 text-xs mt-1.5 flex items-center font-medium">
                                    <CheckCircle size={14} className="mr-1" /> Passwords match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className={`w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-200 transform active:scale-[0.98] ${
                                (loading || !isFormValid) 
                                    ? 'opacity-70 cursor-not-allowed' 
                                    : ''
                            }`}
                        >
                            {loading ? 'Activating...' : 'Activate Account'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ActivateAccount;
