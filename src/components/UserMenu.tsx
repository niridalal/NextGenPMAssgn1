import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user || !profile) return null;

  const displayName = profile.full_name || profile.email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all duration-200 text-white"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold">{initials}</span>
          )}
        </div>
        <span className="font-medium hidden sm:block">{displayName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
            
            <div className="py-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
            
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;