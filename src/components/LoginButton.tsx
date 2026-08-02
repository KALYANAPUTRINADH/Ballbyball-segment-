import React from 'react';
import { LogIn, LogOut, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LoginButton() {
  const { user, logOut } = useAuth();

  if (user) {
    return (
      <div className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-lg">
        <div className="flex items-center space-x-3 truncate">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-slate-200">{user.displayName || 'Admin User'}</p>
            <p className="text-xs text-slate-400 truncate flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {user.phoneNumber || '+91 63056 05194'}
            </p>
          </div>
        </div>
        <button onClick={logOut} className="ml-2 text-slate-400 hover:text-white transition-colors" title="Log Out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => alert('Please sign in via Profile page using your phone number.')}
      className="flex items-center justify-center w-full space-x-2 p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
    >
      <LogIn className="w-4 h-4 shrink-0" />
      <span>Sign In</span>
    </button>
  );
}
