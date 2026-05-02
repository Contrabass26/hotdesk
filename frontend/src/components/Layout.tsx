import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { User } from '../types';
import { useUser } from '../contexts/UserContext';
import { api } from '../services/api';

export function Layout() {
  const { currentUser, setCurrentUser, loading } = useUser();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    api.getUsers().then(setAllUsers).catch(console.error);
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowUserMenu(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Hotdesk</h1>
            <div className="flex items-center gap-4">
              {!currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                  >
                    Select User
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-30">
                      {allUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <nav className="flex gap-2">
                    <NavLink to="/" className={navLinkClass}>
                      Book a Desk
                    </NavLink>
                    <NavLink to="/my-bookings" className={navLinkClass}>
                      My Bookings
                    </NavLink>
                    {currentUser.isAdmin && (
                      <NavLink to="/admin" className={navLinkClass}>
                        Admin
                      </NavLink>
                    )}
                  </nav>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                    >
                      {currentUser.name}
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-red-600"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
