import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Mail, Calendar, ChevronDown, Key, Eye, EyeOff } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ProfileDropdownProps {
  user: SupabaseUser;
  onSignOut: () => void;
  onShowDocuments?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onSignOut, onShowDocuments }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    setResetMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: window.location.origin,
      });
      
      if (error) throw error;
      
      setResetMessage('Password reset email sent! Check your inbox.');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setResetMessage(null);
      }, 5000);
    } catch (error: any) {
      setResetMessage(`Error: ${error.message}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleBackToProfile = () => {
    setShowAccountSettings(false);
    setResetMessage(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-gray-900 px-4 py-2 rounded-xl shadow-lg border border-white/20 transition-all duration-200 font-medium"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {getInitials(user.email || '')}
        </div>
        <span className="hidden sm:block">{user.email?.split('@')[0]}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50">
          {!showAccountSettings ? (
            <>
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                    {getInitials(user.email || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </h3>
                    <p className="text-blue-100 text-sm truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Member since</p>
                      <p className="text-sm text-gray-600">
                        {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Account Status</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-green-600 font-medium">Active</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {onShowDocuments && (
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        onShowDocuments();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    >
                      <svg className="h-5 w-5 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium group-hover:text-purple-600 transition-colors">My Documents</span>
                    </button>
                  )}

                  <button 
                    onClick={() => setShowAccountSettings(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  >
                    <Settings className="h-5 w-5 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium group-hover:text-blue-600 transition-colors">Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Account Settings Header */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-6 text-white">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToProfile}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">Account Settings</h3>
                    <p className="text-gray-300 text-sm">Manage your account details</p>
                  </div>
                </div>
              </div>

              {/* Account Settings Content */}
              <div className="p-6 space-y-6">
                {/* Email Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{user.email}</p>
                      <p className="text-xs text-gray-500">Your email cannot be changed</p>
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border">
                    <Key className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900 font-medium">
                          {showPassword ? '••••••••••••' : '••••••••••••'}
                        </p>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Hidden for security</p>
                    </div>
                  </div>
                </div>

                {/* Reset Password Button */}
                <div className="space-y-3">
                  <button
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-all duration-200 font-medium"
                  >
                    <Key className="h-5 w-5" />
                    <span>
                      {isResettingPassword ? 'Sending Reset Email...' : 'Reset Password'}
                    </span>
                  </button>
                  
                  {resetMessage && (
                    <div className={`p-3 rounded-xl text-sm ${
                      resetMessage.includes('Error') 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {resetMessage}
                    </div>
                  )}
                </div>

                {/* Account Info */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Account Created:</span>
                      <span className="font-medium">
                        {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Status:</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;