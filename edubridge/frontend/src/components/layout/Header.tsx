import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, ExternalLink, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationAPI, profileAPI } from '../../services/api';

const Header = () => {
    const { user, updateUser } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch fresh profile photo from API on mount
    useEffect(() => {
        const fetchProfilePhoto = async () => {
            try {
                const res = await profileAPI.getProfile();
                const photo = res.data?.profile_photo || null;
                setProfilePhoto(photo);
                // Also sync into AuthContext so it persists on next load
                if (photo && photo !== user?.profile_photo) {
                    updateUser({ profile_photo: photo });
                }
            } catch (err) {
                // silently ignore — fall back to initials
            }
        };
        fetchProfilePhoto();
    }, []);

    // Keep local profilePhoto in sync if AuthContext user changes (e.g., after upload on Profile page)
    useEffect(() => {
        if (user?.profile_photo) {
            setProfilePhoto(user.profile_photo);
        }
    }, [user?.profile_photo]);

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

    const getPortalBadgeStyles = (role: string) => {
        switch (role) {
            case 'admin': return {
                bg: 'bg-purple-500/10',
                text: 'text-purple-600',
                border: 'border-purple-200/50',
                dot: 'bg-purple-500'
            };
            case 'teacher': return {
                bg: 'bg-blue-500/10',
                text: 'text-blue-600',
                border: 'border-blue-200/50',
                dot: 'bg-blue-500'
            };
            case 'student': return {
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-600',
                border: 'border-emerald-200/50',
                dot: 'bg-emerald-500'
            };
            case 'parent': return {
                bg: 'bg-orange-500/10',
                text: 'text-orange-600',
                border: 'border-orange-200/50',
                dot: 'bg-orange-500'
            };
            default: return {
                bg: 'bg-gray-500/10',
                text: 'text-gray-600',
                border: 'border-gray-200/50',
                dot: 'bg-gray-500'
            };
        }
    };

    const badgeStyles = user?.role ? getPortalBadgeStyles(user.role) : getPortalBadgeStyles('');

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 z-30 sticky top-0 shrink-0">
            {/* Logo & Portal Indicator */}
            <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-bold text-gray-800">EduBridge</span>
                </Link>

                {user?.role && (
                    <>
                        <div className="h-6 w-px bg-gray-200 mx-4" />
                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 ${badgeStyles.bg} ${badgeStyles.border}`}>
                            <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)] ${badgeStyles.dot}`} />
                            <span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${badgeStyles.text}`}>
                                {user.role} Portal
                            </span>
                        </div>
                    </>
                )}
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
                <Link to="/profile" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary-300 transition-all duration-200 bg-primary-600 flex-shrink-0">
                        {profilePhoto ? (
                            <img
                                src={`/${profilePhoto}`}
                                alt={user?.full_name || 'Profile'}
                                className="w-full h-full object-cover"
                                onError={() => setProfilePhoto(null)}
                            />
                        ) : (
                            <span className="text-white font-semibold text-sm select-none">
                                {user?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() ||
                                    user?.email?.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                            {user?.full_name || user?.email}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {user?.role}
                            {user?.subject && ` - ${user.subject}`}
                        </p>
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Header;
