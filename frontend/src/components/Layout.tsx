import {Navigate, NavLink, Outlet, useNavigate} from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { api } from '../services/api';

export function Layout() {
  const { currentUser, setCurrentUser, loading } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    } finally {
      setCurrentUser(null);
      setShowUserMenu(false);
      setShowMobileMenu(false);
      navigate('/');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md font-medium transition-colors ${isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 hover:bg-gray-100'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md font-medium transition-colors ${isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 hover:bg-gray-100'
    }`;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2/3 mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Hotdesk</h1>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-4">
              {currentUser && (
                <>
                  <nav className="flex gap-2">
                    <NavLink to="/book" className={navLinkClass}>
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

            {/* Mobile hamburger button */}
            <button
              className="sm:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu panel */}
          {showMobileMenu && (
            <div className="sm:hidden mt-3 pb-2 border-t pt-3 space-y-1">
              {currentUser && (
                <>
                  <NavLink to="/" className={mobileNavLinkClass} onClick={() => setShowMobileMenu(false)}>
                    Book a Desk
                  </NavLink>
                  <NavLink to="/my-bookings" className={mobileNavLinkClass} onClick={() => setShowMobileMenu(false)}>
                    My Bookings
                  </NavLink>
                  {currentUser.isAdmin && (
                    <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setShowMobileMenu(false)}>
                      Admin
                    </NavLink>
                  )}
                  <div className="border-t mt-2 pt-2">
                    <div className="px-3 py-1 text-sm text-gray-500">{currentUser.name}</div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-gray-100 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2/3 mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
