import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Hotdesk</h1>
            <nav className="flex gap-2">
              <NavLink to="/" className={navLinkClass}>
                Book a Desk
              </NavLink>
              <NavLink to="/my-bookings" className={navLinkClass}>
                My Bookings
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
