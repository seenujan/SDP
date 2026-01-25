import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';

interface Event {
    id: number;
    title: string;
    description: string;
    event_date: string;
    created_by: number;
    created_by_name?: string;
}

const Events = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', eventDate: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await teacherAPI.getEvents();
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await teacherAPI.updateEvent(editingId, formData);
            } else {
                await teacherAPI.createEvent(formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ title: '', description: '', eventDate: '' });
            fetchEvents();
        } catch (error) {
            console.error('Failed to save event:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (event: Event) => {
        setEditingId(event.id);
        setFormData({
            title: event.title,
            description: event.description,
            eventDate: event.event_date.split('T')[0] // Format date for input
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await teacherAPI.deleteEvent(id);
            fetchEvents();
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    const handleNewEvent = () => {
        setEditingId(null);
        setFormData({ title: '', description: '', eventDate: '' });
        setShowModal(true);
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Events</h1>
                        <p className="text-gray-600 mt-1">Manage school events</p>
                    </div>
                    <button
                        onClick={handleNewEvent}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        New Event
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No events scheduled</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">
                                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
                                <p className="text-gray-600 text-sm">{event.description}</p>
                                <p className="text-xs text-gray-500 mt-3">
                                    {new Date(event.event_date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg w-full max-w-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                {editingId ? 'Edit Event' : 'New Event'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                                    <input
                                        type="date"
                                        value={formData.eventDate}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {submitting
                                            ? (editingId ? 'Updating...' : 'Creating...')
                                            : (editingId ? 'Update Event' : 'Create Event')
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Events;
