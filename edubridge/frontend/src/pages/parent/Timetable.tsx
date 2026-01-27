import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { parentAPI } from '../../services/api';
import { Calendar, Clock, BookOpen, UserCircle } from 'lucide-react';

interface TimetableEntry {
    id: number;
    class_id: number;
    class_name: string;
    subject: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    teacher_name: string;
}

const ParentTimetable = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string>('');

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    useEffect(() => {
        fetchChildren();
        setSelectedDay(daysOfWeek.includes(today) ? today : 'Monday');
    }, []);

    useEffect(() => {
        if (selectedChildId) {
            fetchTimetable(selectedChildId);
        }
    }, [selectedChildId]);

    const fetchChildren = async () => {
        try {
            const response = await parentAPI.getDashboard();
            setChildren(response.data.children || []);
            if (response.data.children && response.data.children.length > 0) {
                setSelectedChildId(response.data.children[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch children:', error);
            setLoading(false);
        }
    };

    const fetchTimetable = async (childId: number) => {
        setLoading(true);
        try {
            const response = await parentAPI.getChildTimetable(childId);
            setTimetable(response.data);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTimetableForDay = (day: string) => {
        return timetable
            .filter(entry => entry.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (loading && children.length === 0) {
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
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Child's Timetable</h1>
                        <p className="text-gray-600 mt-1">View weekly class schedule</p>
                    </div>

                    {children.length > 1 && (
                        <div className="mt-4 md:mt-0">
                            <select
                                value={selectedChildId || ''}
                                onChange={(e) => setSelectedChildId(parseInt(e.target.value))}
                                className="bg-white border text-gray-800 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {children.map((child) => (
                                    <option key={child.id} value={child.id}>
                                        {child.full_name} ({child.grade})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {!selectedChildId ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <UserCircle size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No student profile found linked to your account.</p>
                    </div>
                ) : (
                    <>
                        {/* Day Selector */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <div className="flex gap-2 overflow-x-auto">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedDay === day
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } ${day === today ? 'ring-2 ring-blue-300' : ''}`}
                                    >
                                        {day}
                                        {day === today && <span className="ml-2 text-xs">(Today)</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Timetable View */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <Calendar className="mr-2" size={20} />
                                {selectedDay}'s Schedule
                            </h2>

                            {loading ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Loading timetable...</p>
                                </div>
                            ) : getTimetableForDay(selectedDay).length === 0 ? (
                                <div className="text-center py-12">
                                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 text-lg">No classes scheduled for {selectedDay}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getTimetableForDay(selectedDay).map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="bg-blue-600 text-white w-16 h-16 rounded-lg flex flex-col items-center justify-center mr-4">
                                                <Clock size={20} />
                                                <span className="text-xs mt-1">Period</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                    {entry.subject}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Teacher: {entry.teacher_name || 'Not assigned'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-blue-600">
                                                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {(() => {
                                                        const start = new Date(`1970-01-01T${entry.start_time}`);
                                                        const end = new Date(`1970-01-01T${entry.end_time}`);
                                                        const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                                        return `${duration} minutes`;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ParentTimetable;
