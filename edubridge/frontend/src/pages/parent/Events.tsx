import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { School, Calendar, MapPin, Clock } from 'lucide-react';

interface Event {
    id: number;
    title: string;
    description: string;
    event_date: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    event_type?: string;
}

const ParentEvents = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await parentAPI.getEvents();
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const upcomingEvents = events.filter(event => new Date(event.event_date) >= new Date());
    const pastEvents = events.filter(event => new Date(event.event_date) < new Date());

    const displayedEvents = tab === 'upcoming' ? upcomingEvents : pastEvents;

    const getEventTypeColor = (type?: string) => {
        const safeType = (type || 'general').toLowerCase();
        switch (safeType) {
            case 'sports':
                return 'bg-green-100 text-green-700';
            case 'cultural':
                return 'bg-purple-100 text-purple-700';
            case 'academic':
                return 'bg-blue-100 text-blue-700';
            case 'holiday':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">School Events</h1>
                    <p className="text-gray-600 mt-1">Stay updated with school events and activities</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setTab('upcoming')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'upcoming' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Upcoming ({upcomingEvents.length})
                        </button>
                        <button
                            onClick={() => setTab('past')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'past' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Past ({pastEvents.length})
                        </button>
                    </div>
                </div>

                {/* Events List */}
                <div className="space-y-4">
                    {displayedEvents.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <School size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">
                                No {tab} events
                            </p>
                        </div>
                    ) : (
                        displayedEvents.map((event) => (
                            <div key={event.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start space-x-4">
                                    <div className="w-16 h-16 bg-primary-100 rounded-lg flex flex-col items-center justify-center shrink-0">
                                        <span className="text-xs text-primary-600 font-semibold">
                                            {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="text-2xl font-bold text-primary-700">
                                            {new Date(event.event_date).getDate()}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(event.event_type)}`}>
                                                {event.event_type || 'General'}
                                            </span>
                                        </div>

                                        <p className="text-gray-700 mb-4">{event.description}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar size={16} className="mr-2" />
                                                <span>{new Date(event.event_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock size={16} className="mr-2" />
                                                <span>{event.start_time ? `${event.start_time} - ${event.end_time || ''}` : 'All Day'}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin size={16} className="mr-2" />
                                                <span>{event.location || 'School Campus'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ParentEvents;
