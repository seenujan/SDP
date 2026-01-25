import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { studentAPI } from '../../services/api';
import { Megaphone, Calendar, User } from 'lucide-react';

interface Announcement {
    id: number;
    title: string;
    message: string;
    posted_by_name: string;
    posted_at: string;
}

const Announcements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await studentAPI.getAnnouncements();
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading announcements...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
                    <p className="text-gray-600 mt-1">Latest updates and news from the school</p>
                </div>

                <div className="space-y-6">
                    {announcements.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Megaphone size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">No announcements yet</p>
                        </div>
                    ) : (
                        announcements.map((announcement) => (
                            <div key={announcement.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                                    <span className="text-sm text-gray-500 flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                        <Calendar size={14} className="mr-1" />
                                        {new Date(announcement.posted_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap mb-4">{announcement.message}</p>
                                <div className="flex items-center text-sm text-gray-500 border-t pt-4">
                                    <User size={16} className="mr-2" />
                                    <span>Posted by {announcement.posted_by_name}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Announcements;
