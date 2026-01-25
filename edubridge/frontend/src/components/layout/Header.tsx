import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, ExternalLink, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../services/api';

const Header = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll for notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getNotifications(4); // Only get recent 4
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationAPI.markAsRead(id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id, { stopPropagation: () => { } } as any);
        }
        // Navigate based on type if needed, or just close dropdown
        setIsOpen(false);
        if (notification.type === 'ptm') {
            // Determine route based on role
            const route = user?.role === 'parent' ? '/parent/ptm-booking' :
                user?.role === 'teacher' ? '/teacher/ptm-booking' : '/notifications';
            navigate(route);
        } else {
            navigate('/notifications');
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 z-30 relative shrink-0">
            {/* Logo */}
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold text-gray-800">EduBridge</span>
            </div>

            <div className="flex items-center space-x-6">

                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors mt-1"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Bell size={24} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                            <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
                                <Link
                                    to="/notifications"
                                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View All <ExternalLink size={12} />
                                </Link>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400 text-sm">
                                        No recent notifications
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors relative group ${!notification.is_read ? 'bg-blue-50/40' : ''
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                        className="text-gray-400 hover:text-green-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-1">{notification.message}</p>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                            {user?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                                user?.email?.substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">
                            {user?.full_name || user?.email}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {user?.role}
                            {user?.subject && ` - ${user.subject}`}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
