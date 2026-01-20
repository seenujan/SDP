import React from 'react';

interface BadgeProps {
    status: 'active' | 'inactive' | 'present' | 'absent' | 'late' | 'on_time' | 'pending' | 'completed';
    children?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ status, children }) => {
    const statusConfig: Record<string, string> = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        present: 'bg-green-100 text-green-800',
        absent: 'bg-red-100 text-red-800',
        late: 'bg-orange-100 text-orange-800',
        on_time: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-blue-100 text-blue-800',
    };

    const displayText: Record<string, string> = {
        on_time: 'On Time',
        active: 'Active',
        inactive: 'Inactive',
        present: 'Present',
        absent: 'Absent',
        late: 'Late',
        pending: 'Pending',
        completed: 'Completed',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'
                }`}
        >
            {children || displayText[status] || status}
        </span>
    );
};

export default Badge;
