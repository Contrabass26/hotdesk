import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

export function AdminLayout() {
  const { currentUser } = useUser();

  if (!currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex gap-1">
          <NavLink to="/admin" end className={tabClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/desks" className={tabClass}>
            Desks
          </NavLink>
          <NavLink to="/admin/bookings" className={tabClass}>
            Bookings
          </NavLink>
          <NavLink to="/admin/users" className={tabClass}>
            Users
          </NavLink>
          <NavLink to="/admin/floors" className={tabClass}>
            Floors
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
