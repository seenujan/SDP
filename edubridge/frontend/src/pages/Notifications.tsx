import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { notificationAPI } from '../services/api';
import { Bell, CheckCircle, Info, Calendar, FileText, CheckCheck } from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'ptm' | 'system' | 'assignment' | 'exam';
    is_read: boolean;
    created_at: string;
}

const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getNotifications(50); // Get up to 50 for full page
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ptm': return <Calendar className="text-purple-600" size={24} />;
            case 'assignment': return <FileText className="text-blue-600" size={24} />;
            case 'exam': return <FileText className="text-red-600" size={24} />;
            default: return <Info className="text-gray-600" size={24} />;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Bell className="text-primary-600" size={32} />
                        Notifications
                    </h1>
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                        <CheckCheck size={16} />
                        Mark all as read
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <p className="text-gray-500">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                        <Bell className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-lg shadow-sm p-4 border-l-4 transition-all hover:shadow-md ${notification.is_read ? 'border-gray-200' : 'border-primary-500 bg-blue-50/30'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full ${notification.is_read ? 'bg-gray-100' : 'bg-primary-50'}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mt-1 text-sm">{notification.message}</p>
                                    </div>
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="text-gray-400 hover:text-green-600 transition-colors"
                                            title="Mark as read"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Notifications;
