import React from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../../../context/AuthContext';
import { useLayout } from '../../../context/LayoutContext';

const Navbar = () => {
    const { toggleSidebar } = useLayout();
    const { user } = useAuthStore();

    // Get initials for profile photo
    const getInitials = () => {
        const firstInitial = user?.first_name?.[0] || '';
        const lastInitial = user?.last_name?.[0] || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    const profileImage = user?.user_image;

    return (
        <>
            <div className='flex justify-between items-center h-[72px] px-4 z-20 mt-4 mr-4 ml-4 md:mt-0 md:mr-0 md:ml-0 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl'>
                <div className="flex items-center gap-3">
                    {/* Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className='p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 active:bg-gray-200'
                    >
                        <Menu className='w-6 h-6' />
                    </button>

                    {/* Mobile Greeting */}
                    <div className="flex flex-col md:hidden">
                        <h1 className="text-lg font-bold text-slate-700 tracking-tight flex items-center gap-2">
                            Hi, <span className="capitalize">{user?.first_name?.toLowerCase()}</span> <span className="animate-wave origin-[70%_70%]">👋</span>
                        </h1>
                    </div>
                </div>

                {/* Right Side Icons */}
                <div className='flex items-center gap-2 sm:gap-4'>
                    {/* User Info */}
                    <div className='flex items-center gap-3'>
                        <div className='text-right hidden sm:block'>
                            <p className='text-sm font-bold text-slate-700 leading-none mb-1 capitalize'>
                                {user?.first_name?.toLowerCase()} {user?.last_name?.toLowerCase()}
                            </p>
                            <p className='text-xs text-primary font-semibold capitalize bg-primary/10 px-2 py-0.5 rounded-full inline-block'>
                                {user?.role === 'bde' || user?.role === 'Bde' ? 'BDE' : user?.role || 'User'}
                            </p>
                        </div>

                        <div className='relative'>
                            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary-hover to-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 ring-2 ring-white'>
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={`${user.first_name} ${user.last_name}`}
                                        className='w-full h-full rounded-full object-cover'
                                    />
                                ) : (
                                    <span>{getInitials()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
