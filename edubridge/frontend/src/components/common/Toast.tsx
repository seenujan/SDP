import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success': return 'bg-green-50 text-green-800 border-green-200';
            case 'error': return 'bg-red-50 text-red-800 border-red-200';
            default: return 'bg-blue-50 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-fade-in-down ${getStyles()}`}>
            {getIcon()}
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
