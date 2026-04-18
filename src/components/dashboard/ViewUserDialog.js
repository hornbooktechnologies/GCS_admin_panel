import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Mail, Phone, User, Shield, Activity, Calendar, Copy } from 'lucide-react';
import useToast from '../../hooks/useToast';

const ViewUserDialog = ({ isOpen, setIsOpen, user }) => {
    if (!user) return null;

    const renderStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-700 border border-green-200',
            inactive: 'bg-red-100 text-red-700 border border-red-200',
        };
        return (
            <Badge className={`capitalize px-3 py-1 font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {status}
            </Badge>
        );
    };

    const InfoCard = ({ icon: Icon, label, value, isLink = false, iconColor = 'text-blue-500', showCopy = false }) => {
        const { showSuccessToast } = useToast();

        const handleCopy = async (text) => {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                    showSuccessToast(`${label} copied to clipboard`);
                } else {
                    // Fallback for non-secure contexts or older browsers
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    textArea.style.top = "0";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        showSuccessToast(`${label} copied to clipboard`);
                    } catch (err) {
                        console.error('Fallback copy failed', err);
                    }
                    document.body.removeChild(textArea);
                }
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        };

        return (
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group relative">
                <div className={`mt-0.5 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    {isLink && value ? (
                        <a href={`mailto:${value}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all block">
                            {value}
                        </a>
                    ) : (
                        <p className="text-sm font-semibold text-gray-900 break-words">{value || 'N/A'}</p>
                    )}
                </div>
                {value && showCopy && (
                    <button
                        onClick={() => handleCopy(value)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                        title={`Copy ${label}`}
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px] overflow-hidden p-0 border-0 shadow-2xl [&>button]:!text-white [&>button]:top-5 [&>button]:right-5 [&>button]:focus:ring-0 [&>button]:focus:outline-none [&>button]:transition-all [&>button>svg]:w-6 [&>button>svg]:h-6 [&>button>svg]:stroke-[3]">
                {/* Gradient Header */}
                <DialogHeader className="bg-gradient-to-r from-primary via-primary-hover to-primary text-white p-6 pb-8 shrink-0 !text-left !items-start">
                    <DialogTitle className="text-2xl font-bold">User Details</DialogTitle>
                </DialogHeader>

                <div className="px-6">
                    {/* Profile Section */}
                    <div className="relative mb-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                {/* Profile Avatar Placeholder */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl bg-gradient-to-br from-[#3a5f9e] via-[#5283c5] to-[#6fa8dc] ring-4 ring-blue-50 flex items-center justify-center text-3xl font-bold text-white">
                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border-2 border-blue-100">
                                        <User className="w-4 h-4 text-[#3a5f9e]" />
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="text-center sm:text-left flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                                        {user.first_name} {user.last_name}
                                    </h2>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                                        <Shield className="w-4 h-4 text-purple-600" />
                                        <p className="text-lg font-semibold text-purple-600 capitalize">{user.role}</p>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-start gap-3">
                                        {renderStatusBadge(user.status)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-3">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-3 border-b border-blue-200">
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Contact Information
                            </h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoCard icon={Mail} label="Email Address" value={user.email} isLink={true} iconColor="text-green-500" showCopy={true} />
                            <InfoCard icon={Phone} label="Phone Number" value={user.phone_number} iconColor="text-purple-500" showCopy={true} />
                            <InfoCard icon={Calendar} label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : 'N/A'} iconColor="text-pink-500" />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewUserDialog;

