import React, { useState } from 'react';
import { User, LogOut, ChevronDown, Mail, Calendar, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
      >
        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">
            {user?.email ? getInitials(user.email) : 'U'}
          </span>
        </div>
        
        {/* User Info */}
        <div className="hidden sm:block text-left">
          <p className="font-semibold text-sm leading-tight">
            {user?.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-gray-500 text-xs">
            {user?.email?.split('@')[1] || 'Account'}
          </p>
        </div>
        
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20 animate-fadeInUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user?.email ? getInitials(user.email) : 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate font-sans">
                    {user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-blue-100 text-sm truncate font-medium">
                    {user?.email || 'No email'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-sans">
                  Account Details
                </h4>
                
                {/* Email */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                      Email Address
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate font-sans">
                      {user?.email || 'Not available'}
                    </p>
                  </div>
                </div>

                {/* User ID */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                      User ID
                    </p>
                    <p className="text-sm font-bold font-mono text-gray-900 truncate">
                      {user?.id ? `${user.id.substring(0, 8)}...` : 'Not available'}
                    </p>
                  </div>
                </div>

                {/* Account Created */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
                      Member Since
                    </p>
                    <p className="text-sm font-bold text-gray-900 font-sans">
                      {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700 font-sans">Account Status</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 font-sans">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 p-4 space-y-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium font-sans"
              >
                <Settings className="h-4 w-4" />
                <span className="font-semibold">Account Settings</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium font-sans"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;