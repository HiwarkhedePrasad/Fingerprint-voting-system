import React from 'react';
import { LogOut, User } from 'lucide-react';

const Navbar = ({ isAuthenticated, isAdmin, user, onLogout }) => {
  return (
    <nav className="bg-amber-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">SecureVote</h1>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User size={20} />
                <span className="font-medium">
                  {user?.name} {isAdmin && '(Admin)'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-amber-700 px-4 py-2 rounded-lg hover:bg-amber-900 transition-colors"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;