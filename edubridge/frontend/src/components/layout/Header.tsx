import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-end px-8">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                        {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() ||
                            user?.email?.substring(0, 2).toUpperCase()}
                    </span>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                        {user?.full_name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                        {user?.role}
                        {user?.subject && ` - ${user.subject}`}
                    </p>
                </div>
            </div>
        </header>
    );
};

export default Header;
