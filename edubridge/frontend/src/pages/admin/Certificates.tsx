import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import { Award, Plus, Trash2, Search, Download, Filter } from 'lucide-react';
import { generateCertificatePDF } from '../../utils/certificatePDF';

interface Certificate {
    id: number;
    student_name: string;
    roll_number: string;
    class_name: string;
    certificate_type: string;
    title: string;
    description: string | null;
    issue_date: string;
    certificate_number: string;
    issued_by_name: string;
    created_at: string;
}

interface Student {
    id: number;
    full_name: string;
    roll_number: string;
    class_name: string;
}

const CERTIFICATE_TYPES = [
    'Achievement Certificate',
    'Merit Certificate',
    'Participation Certificate',
    'Excellence Certificate',
    'Good Conduct Certificate',
    'Sports Certificate',
    'Cultural Activity Certificate',
];

const Certificates = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const [formData, setFormData] = useState({
        studentId: '',
        certificateType: '',
        title: '',
        description: '',
        issueDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchCertificates();
        fetchGrades();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllCertificates();
            setCertificates(response.data);
        } catch (error) {
            console.error('Failed to fetch certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await adminAPI.getGrades();
            setGrades(response.data);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
        }
    };

    const handleGradeChange = async (grade: string) => {
        setSelectedGrade(grade);
        setSelectedSection('');
        setStudents([]);
        setFormData({ ...formData, studentId: '' });

        if (grade) {
            try {
                const response = await adminAPI.getSectionsForGrade(grade);
                setSections(response.data);
            } catch (error) {
                console.error('Failed to fetch sections:', error);
            }
        } else {
            setSections([]);
        }
    };

    const handleSectionChange = async (section: string) => {
        setSelectedSection(section);
        setFormData({ ...formData, studentId: '' });

        if (selectedGrade && section) {
            try {
                const response = await adminAPI.getStudentsByFilter(selectedGrade, section);
                setStudents(response.data);
            } catch (error) {
                console.error('Failed to fetch students:', error);
                setStudents([]);
            }
        } else {
            setStudents([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.studentId || !formData.certificateType || !formData.title) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            await adminAPI.createCertificate({
                studentId: parseInt(formData.studentId),
                certificateType: formData.certificateType,
                title: formData.title,
                description: formData.description,
                issueDate: formData.issueDate,
            });

            alert('Certificate created successfully!');
            setShowForm(false);
            setFormData({
                studentId: '',
                certificateType: '',
                title: '',
                description: '',
                issueDate: new Date().toISOString().split('T')[0],
            });
            setSelectedGrade('');
            setSelectedSection('');
            setStudents([]);
            setSections([]);
            fetchCertificates();
        } catch (error) {
            console.error('Failed to create certificate:', error);
            alert('Failed to create certificate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this certificate?')) {
            return;
        }

        try {
            await adminAPI.deleteCertificate(id);
            alert('Certificate deleted successfully!');
            fetchCertificates();
        } catch (error) {
            console.error('Failed to delete certificate:', error);
            alert('Failed to delete certificate. Please try again.');
        }
    };

    const filteredCertificates = certificates.filter((cert) => {
        const matchesSearch =
            cert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = !filterType || cert.certificate_type === filterType;

        return matchesSearch && matchesType;
    });

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Certificate Management</h1>
                    <p className="text-gray-600 mt-1">Issue and manage student certificates</p>
                </div>

                {/* Action Bar */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                        >
                            <Plus size={20} className="mr-2" />
                            Issue New Certificate
                        </button>

                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by student or cert number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full md:w-80"
                                />
                            </div>

                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                {CERTIFICATE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Certificate Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <Filter className="mr-2" size={20} />
                            Issue New Certificate
                        </h3>
                        <form onSubmit={handleSubmit}>
                            {/* Filter Section */}
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <p className="text-sm text-gray-600 mb-3">First, filter students by grade and section:</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Grade *
                                        </label>
                                        <select
                                            value={selectedGrade}
                                            onChange={(e) => handleGradeChange(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        >
                                            <option value="">Choose grade</option>
                                            {grades.map((g) => (
                                                <option key={g.grade} value={g.grade}>
                                                    {g.grade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Section *
                                        </label>
                                        <select
                                            value={selectedSection}
                                            onChange={(e) => handleSectionChange(e.target.value)}
                                            disabled={!selectedGrade}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                        >
                                            <option value="">Choose section</option>
                                            {sections.map((s) => (
                                                <option key={s.section} value={s.section}>
                                                    {s.section}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Student *
                                        </label>
                                        <select
                                            value={formData.studentId}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            disabled={students.length === 0}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                            required
                                        >
                                            <option value="">Choose student</option>
                                            {students.map((student) => (
                                                <option key={student.id} value={student.id}>
                                                    {student.roll_number} - {student.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Certificate Details Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Certificate Type *
                                    </label>
                                    <select
                                        value={formData.certificateType}
                                        onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
                                        disabled={!formData.studentId}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        {CERTIFICATE_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., First Place in Science Fair"
                                        disabled={!formData.studentId}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Issue Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.issueDate}
                                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                        disabled={!formData.studentId}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Additional details about the certificate..."
                                        disabled={!formData.studentId}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                                >
                                    {loading ? 'Creating...' : 'Issue Certificate'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Certificates Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Certificate Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Issue Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Issued By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCertificates.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            <Award size={48} className="mx-auto text-gray-400 mb-4" />
                                            <p className="text-lg">
                                                {searchTerm || filterType
                                                    ? 'No certificates found matching your filters'
                                                    : 'No certificates issued yet'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCertificates.map((cert) => (
                                        <tr key={cert.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm font-medium text-primary-600">
                                                    {cert.certificate_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {cert.student_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {cert.roll_number} • {cert.class_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                                                    {cert.certificate_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{cert.title}</div>
                                                {cert.description && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {cert.description.length > 50
                                                            ? cert.description.substring(0, 50) + '...'
                                                            : cert.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(cert.issue_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {cert.issued_by_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => generateCertificatePDF({
                                                            certificate_number: cert.certificate_number,
                                                            student_name: cert.student_name,
                                                            certificate_type: cert.certificate_type,
                                                            title: cert.title,
                                                            description: cert.description || undefined,
                                                            issue_date: cert.issue_date,
                                                            issued_by_name: cert.issued_by_name,
                                                        })}
                                                        className="text-primary-600 hover:text-primary-900 transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cert.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stats */}
                {certificates.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-semibold">{filteredCertificates.length}</span> of{' '}
                            <span className="font-semibold">{certificates.length}</span> certificates
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Certificates;
