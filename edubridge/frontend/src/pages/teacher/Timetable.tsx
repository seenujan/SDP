import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { teacherAPI } from '../../services/api';
import { Calendar, Clock, BookOpen, Users, AlertCircle } from 'lucide-react';

interface TimetableEntry {
    id: number;
    class_id: number;
    class_name: string;
    subject: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    grade: string;
    section: string;
    is_relief?: boolean;
    original_teacher?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
};

const Timetable = () => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await teacherAPI.getMyTimetable();
            setTimetable(response.data || []);
        } catch (err) {
            console.error('Failed to fetch timetable:', err);
            setError('Failed to load timetable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const uniqueTimeSlots = Array.from(
        new Set(timetable.map(entry => `${entry.start_time}-${entry.end_time}`))
    ).sort((a, b) => a.localeCompare(b));

    const getEntryForSlot = (day: string, slot: string) => {
        return timetable.find(e => e.day_of_week === day && `${e.start_time}-${e.end_time}` === slot) || null;
    };

    const totalClassesThisWeek = timetable.filter(e => !e.is_relief).length;
    const totalReliefClasses = timetable.filter(e => e.is_relief).length;
    const todayClasses = timetable.filter(e => e.day_of_week === today).length;

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Timetable</h1>
                        <p className="text-gray-600 mt-1">Your weekly teaching schedule at a glance</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Calendar className="text-blue-600" size={22} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{totalClassesThisWeek}</p>
                            <p className="text-sm text-gray-500">Weekly Classes</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="text-emerald-600" size={22} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{todayClasses}</p>
                            <p className="text-sm text-gray-500">Classes Today</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Users className="text-orange-600" size={22} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{totalReliefClasses}</p>
                            <p className="text-sm text-gray-500">Relief Classes</p>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                        <p className="text-red-700 text-sm">{error}</p>
                        <button onClick={fetchTimetable} className="ml-auto text-sm text-red-600 font-medium hover:underline">Retry</button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading your timetable...</p>
                    </div>
                ) : (
                    /* ─── GRID VIEW ─── */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="p-3 text-center font-bold text-gray-400 uppercase text-xs tracking-wider w-32 border-b border-transparent">
                                            Time
                                        </th>
                                        {DAYS.map(day => {
                                            const isToday = day === today;
                                            return (
                                                <th key={day} className={`p-4 text-center font-semibold relative ${isToday ? 'bg-blue-50/60 text-blue-800 rounded-t-3xl' : 'text-gray-500 border-b border-gray-100'}`}>
                                                    {day}
                                                    {isToday && <span className="ml-2 inline-block px-1.5 py-0.5 bg-blue-500 text-white text-[10px] uppercase rounded-full align-middle font-bold">Today</span>}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {uniqueTimeSlots.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                                No classes scheduled yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        uniqueTimeSlots.map((slot, index) => {
                                            const [start, end] = slot.split('-');
                                            const isLastRow = index === uniqueTimeSlots.length - 1;
                                            return (
                                                <tr key={slot} className="group">
                                                    <td className="p-3 text-center align-middle whitespace-nowrap border-b border-gray-50">
                                                        <div className="font-bold text-gray-700">Period {index + 1}</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-medium bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 flex flex-col gap-0.5 whitespace-nowrap w-max mx-auto">
                                                            <span>{formatTime(start)}</span>
                                                            <span className="text-gray-300">to</span>
                                                            <span>{formatTime(end)}</span>
                                                        </div>
                                                    </td>
                                                    {DAYS.map(day => {
                                                        const entry = getEntryForSlot(day, slot);
                                                        const isToday = day === today;
                                                        const isRelief = Boolean(entry?.is_relief);
                                                        
                                                        let cardClasses = '';
                                                        let subjectClasses = '';
                                                        let textClasses = '';
                                                        let reliefPillClasses = '';

                                                        if (isRelief) {
                                                            if (isToday) {
                                                                cardClasses = 'bg-orange-500 text-white shadow-md shadow-orange-500/20';
                                                                subjectClasses = 'text-white';
                                                                textClasses = 'text-orange-100';
                                                                reliefPillClasses = 'bg-orange-400 text-white border border-orange-300';
                                                            } else {
                                                                cardClasses = 'bg-orange-50 border border-orange-100 hover:border-orange-200 hover:shadow-sm';
                                                                subjectClasses = 'text-orange-900';
                                                                textClasses = 'text-orange-600/80';
                                                                reliefPillClasses = 'bg-orange-200/50 text-orange-800 border border-orange-200';
                                                            }
                                                        } else {
                                                            if (isToday) {
                                                                cardClasses = 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600 ring-offset-2 ring-offset-blue-50/60';
                                                                subjectClasses = 'text-white';
                                                                textClasses = 'text-blue-100';
                                                            } else {
                                                                cardClasses = 'bg-blue-50/70 border border-blue-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm';
                                                                subjectClasses = 'text-blue-900';
                                                                textClasses = 'text-blue-600/80';
                                                            }
                                                        }

                                                        return (
                                                            <td key={day} className={`p-2 align-top border-b border-gray-50 ${isToday ? 'bg-blue-50/60 border-b-transparent' : ''} ${isToday && isLastRow ? 'rounded-b-3xl' : ''}`}>
                                                                {entry ? (
                                                                    <div className={`h-full min-h-[90px] rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all hover:-translate-y-1 cursor-default ${cardClasses}`}>
                                                                        <p className={`font-bold text-base tracking-tight ${subjectClasses}`}>{entry.subject}</p>
                                                                        <p className={`text-sm font-medium mt-0.5 ${textClasses}`}>
                                                                            {entry.class_name || `${entry.grade} ${entry.section}`}
                                                                        </p>
                                                                        {isRelief ? (
                                                                            <span className={`inline-block mt-2 w-max px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-lg tracking-wide ${reliefPillClasses}`}>
                                                                                Relief
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                ) : (
                                                                    <div className={`h-full min-h-[90px] rounded-2xl flex items-center justify-center transition-colors ${isToday ? 'bg-blue-50/30' : 'bg-transparent'}`}>
                                                                        <span className="text-xs text-gray-300 font-medium block opacity-0 group-hover:opacity-100 transition-opacity">—</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Legend */}
                {!loading && timetable.length > 0 && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Legend</p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                                <span>Regular Class</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
                                <span>Relief Class</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                <span>Today</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Timetable;
