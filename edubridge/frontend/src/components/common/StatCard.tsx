import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
    const colorMap = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        orange: 'bg-orange-500',
        purple: 'bg-purple-500',
        red: 'bg-red-500',
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`${colorMap[color]} w-14 h-14 rounded-lg flex items-center justify-center`}>
                <Icon className="text-white" size={28} />
            </div>
        </div>
    );
};

export default StatCard;
