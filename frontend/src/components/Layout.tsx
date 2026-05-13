import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../contexts/useUser';
import { api } from '../services/api';
import { Icon } from './ui/Icons';

export function Layout() {
  const { currentUser, setCurrentUser, loading } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="kn-app-bg kn-loading">
        <div className="kn-panel px-6 py-4">Preparing Hotdesk...</div>
      </div>
    );
  }

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
    `kn-nav-link ${isActive ? 'kn-nav-link-active' : ''}`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `kn-nav-link w-full justify-start ${isActive ? 'kn-nav-link-active' : ''}`;

  return (
    <div className="kn-app-bg">
      <header className="kn-topbar">
        <div className="kn-container py-3">
          <div className="flex items-center justify-between">
            <div className="kn-brand kn-brand-compact">
              <div className="kn-brand-mark" />
              <div className="min-w-0">
                <span className="kn-brand-title">Hotdesk</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              {currentUser && (
                <>
                  <nav className="flex gap-2">
                    <NavLink to="/book" className={navLinkClass}>
                      <Icon name="desk" />
                      Book a Desk
                    </NavLink>
                    <NavLink to="/my-bookings" className={navLinkClass}>
                      <Icon name="bookings" />
                      My Bookings
                    </NavLink>
                    {currentUser.isAdmin && (
                      <NavLink to="/admin" className={navLinkClass}>
                        <Icon name="shield" />
                        Admin
                      </NavLink>
                    )}
                  </nav>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="kn-button kn-button-secondary"
                      aria-expanded={showUserMenu}
                      aria-haspopup="menu"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--kn-green-soft)] text-xs font-bold text-[var(--kn-blue)]">
                        {currentUser.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>{currentUser.name}</span>
                      <Icon name="chevronDown" className="h-3.5 w-3.5" />
                    </button>
                    {showUserMenu && (
                      <div className="kn-panel absolute right-0 z-50 mt-2 w-56 overflow-hidden p-2" role="menu">
                        <div className="border-b border-[var(--kn-line)] px-3 py-2">
                          <div className="text-sm font-bold text-[var(--kn-ink)]">{currentUser.name}</div>
                          <div className="truncate text-xs font-semibold text-[var(--kn-muted)]">{currentUser.email}</div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-[var(--kn-red)] hover:bg-[var(--kn-red-soft)]"
                          role="menuitem"
                        >
                          <Icon name="logout" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              className="kn-icon-button sm:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? (
                <Icon name="close" className="h-5 w-5" />
              ) : (
                <Icon name="menu" className="h-5 w-5" />
              )}
            </button>
          </div>

          {showMobileMenu && (
            <div className="kn-mobile-menu mt-3 space-y-2 pt-3 sm:hidden">
              {currentUser && (
                <>
                  <NavLink to="/book" className={mobileNavLinkClass} onClick={() => setShowMobileMenu(false)}>
                    <Icon name="desk" />
                    Book a Desk
                  </NavLink>
                  <NavLink to="/my-bookings" className={mobileNavLinkClass} onClick={() => setShowMobileMenu(false)}>
                    <Icon name="bookings" />
                    My Bookings
                  </NavLink>
                  {currentUser.isAdmin && (
                    <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setShowMobileMenu(false)}>
                      <Icon name="shield" />
                      Admin
                    </NavLink>
                  )}
                  <div className="mt-2 border-t border-[var(--kn-line)] pb-2 pt-3">
                    <div className="px-3 py-1">
                      <div className="text-sm font-bold text-[var(--kn-ink)]">{currentUser.name}</div>
                      <div className="truncate text-xs font-semibold text-[var(--kn-muted)]">{currentUser.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-[var(--kn-red)] hover:bg-[var(--kn-red-soft)]"
                    >
                      <Icon name="logout" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="kn-container py-7 md:py-9">
        <Outlet />
      </main>
    </div>
  );
}
