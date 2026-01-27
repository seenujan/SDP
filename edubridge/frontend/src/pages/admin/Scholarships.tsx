
import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { Search, Filter, Award, BookOpen, User, Loader } from 'lucide-react';

const Scholarships = () => {
    // State
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters State
    const [incomeLimit, setIncomeLimit] = useState<number | ''>('');
    const [maxRank, setMaxRank] = useState<number | ''>('');
    const [selectedGrade, setSelectedGrade] = useState('');

    // Manual Fetch Trigger
    const handleFindStudents = async () => {
        setLoading(true);
        try {
            const filters = {
                incomeLimit: incomeLimit !== '' ? Number(incomeLimit) : undefined,
                maxRank: maxRank !== '' ? Number(maxRank) : undefined,
                grade: selectedGrade
            };
            const response = await adminAPI.getEligibleStudents(filters);
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch eligible students', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="animate-fade-in space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Scholarship Management</h1>
                    <p className="text-gray-600 mt-1">Track and award scholarships based on eligibility criteria</p>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold border-b pb-2">
                        <Filter className="w-5 h-5" />
                        <h2>Eligibility Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* 1. Parent Income Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Parent Income
                            </label>
                            <input
                                type="number"
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border transition-all hover:border-primary-400"
                                placeholder="e.g. 50000"
                                value={incomeLimit}
                                onChange={(e) => setIncomeLimit(e.target.value ? Number(e.target.value) : '')}
                            />
                            <p className="text-xs text-gray-500 mt-1">Below this amount</p>
                        </div>

                        {/* 2. Class Rank Filter (Replaces GPA) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <BookOpen className="w-4 h-4 text-blue-600" /> Max Class Rank
                            </label>
                            <input
                                type="number"
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border transition-all hover:border-primary-400"
                                placeholder="e.g. 5 (Top 5)"
                                value={maxRank}
                                onChange={(e) => setMaxRank(e.target.value ? Number(e.target.value) : '')}
                            />
                            <p className="text-xs text-gray-500 mt-1">e.g. Top 10 students</p>
                        </div>

                        {/* 3. Grade Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                            <select
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 px-4 py-2 border"
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                            >
                                <option value="">All Grades</option>
                                {[...Array(13)].map((_, i) => (
                                    <option key={i + 1} value={String(i + 1)}>
                                        Grade {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Find Button */}
                        <div>
                            <label className="block text-sm font-medium text-transparent mb-1 select-none">Action</label>
                            <button
                                onClick={handleFindStudents}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" /> Find Eligible Students
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-600" /> Eligible Students
                            <span className="text-gray-400 text-sm font-normal">({students.length})</span>
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Parent Income</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader className="w-5 h-5 animate-spin" /> Loading students...
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.grade} - {student.section}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.parentIncome ? `Rs. ${Number(student.parentIncome).toLocaleString()}` : <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">#{student.class_rank}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.status === 'Awarded' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-primary-600 hover:text-primary-900 flex items-center gap-1 justify-end ml-auto">
                                                    <Award className="w-4 h-4" /> Award
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            No students found matching the criteria. Click "Find Eligible Students" to search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Scholarships;
